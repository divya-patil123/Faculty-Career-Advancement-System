package com.faculty.app.service;

import com.faculty.app.dto.CriteriaDto;
import com.faculty.app.entity.EligibilityCriteria;
import com.faculty.app.repository.EligibilityCriteriaRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EligibilityCriteriaService {

    @Autowired private EligibilityCriteriaRepository repo;

    public static final List<String> ALL_POSTS = List.of(
            "Assistant Professor", "Associate Professor", "Professor", "Principal/HOD");

    // ── Read ─────────────────────────────────────────────────────────────────────

    public List<CriteriaDto.CriteriaResponse> getAllActive() {
        return repo.findByActiveTrueOrderByPostName().stream()
                .map(CriteriaDto.CriteriaResponse::from).collect(Collectors.toList());
    }

    public CriteriaDto.CriteriaResponse getActiveForPost(String post) {
        return repo.findByPostNameAndActiveTrue(post)
                .map(CriteriaDto.CriteriaResponse::from)
                .orElseThrow(() -> new RuntimeException("No active criteria for: " + post));
    }

    public List<CriteriaDto.CriteriaResponse> getHistory(String post) {
        return repo.findByPostNameOrderByVersionDesc(post).stream()
                .map(CriteriaDto.CriteriaResponse::from).collect(Collectors.toList());
    }

    public CriteriaDto.CriteriaResponse getById(Long id) {
        return repo.findById(id).map(CriteriaDto.CriteriaResponse::from)
                .orElseThrow(() -> new RuntimeException("Not found: " + id));
    }

    // ── Save (creates new version, activates immediately) ─────────────────────────

    @Transactional
    public CriteriaDto.CriteriaResponse save(CriteriaDto.SaveRequest req, String by) {
        repo.deactivateAllByPostName(req.getPostName());
        int ver = repo.findMaxVersionByPostName(req.getPostName()) + 1;

        EligibilityCriteria c = EligibilityCriteria.builder()
                .postName(req.getPostName())
                .netSetSletRequirement(req.getNetSetSletRequirement())
                .netAccepted(req.getNetAccepted())
                .setAccepted(req.getSetAccepted())
                .sletAccepted(req.getSletAccepted())
                .minPgPercentage(req.getMinPgPercentage())
                .phdRequired(req.getPhdRequired())
                .minTeachingExperienceYears(req.getMinTeachingExperienceYears())
                .minTotalExperienceYears(req.getMinTotalExperienceYears())
                .minApiScore(req.getMinApiScore())
                .minSciPublications(req.getMinSciPublications())
                .minScopusPublications(req.getMinScopusPublications())
                .minUgcCarePublications(req.getMinUgcCarePublications())
                .minConferencePublications(req.getMinConferencePublications())
                .minLocalPublications(req.getMinLocalPublications())
                .minTotalIndexedPublications(req.getMinTotalIndexedPublications())
                .weightSciPublication(req.getWeightSciPublication())
                .weightScieCitation(req.getWeightScieCitation())
                .weightScopusPublication(req.getWeightScopusPublication())
                .weightUgcCarePublication(req.getWeightUgcCarePublication())
                .weightConferencePublication(req.getWeightConferencePublication())
                .weightLocalPublication(req.getWeightLocalPublication())
                .weightBookChapter(req.getWeightBookChapter())
                .weightTeachingExperiencePerYear(req.getWeightTeachingExperiencePerYear())
                .maxTeachingExperiencePoints(req.getMaxTeachingExperiencePoints())
                .phdBonus(req.getPhdBonus())
                .netSetSletBonus(req.getNetSetSletBonus())
                .pgBonusThreshold1(req.getPgBonusThreshold1())
                .pgBonus1(req.getPgBonus1())
                .pgBonusThreshold2(req.getPgBonusThreshold2())
                .pgBonus2(req.getPgBonus2())
                .version(ver).active(true).activatedAt(LocalDateTime.now())
                .changeNote(req.getChangeNote()).createdBy(by)
                .build();

        return CriteriaDto.CriteriaResponse.from(repo.save(c));
    }

    @Transactional
    public CriteriaDto.CriteriaResponse activateVersion(Long id, String by) {
        EligibilityCriteria c = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Version not found."));
        repo.deactivateAllByPostName(c.getPostName());
        c.setActive(true);
        c.setActivatedAt(LocalDateTime.now());
        c.setCreatedBy(by);
        return CriteriaDto.CriteriaResponse.from(repo.save(c));
    }

    // ── Excel Import ──────────────────────────────────────────────────────────────

    @Transactional
    public CriteriaDto.ImportResult importFromExcel(MultipartFile file, String by) throws IOException {
        List<String> errors = new ArrayList<>();
        List<EligibilityCriteria> saved = new ArrayList<>();
        int skipped = 0;

        Workbook wb = new XSSFWorkbook(file.getInputStream());
        Sheet sheet = wb.getSheetAt(0);

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null || isRowEmpty(row)) continue;
            try {
                EligibilityCriteria c = parseRow(row, by);
                if (c == null) { skipped++; continue; }
                repo.deactivateAllByPostName(c.getPostName());
                c.setVersion(repo.findMaxVersionByPostName(c.getPostName()) + 1);
                saved.add(repo.save(c));
            } catch (Exception e) {
                errors.add("Row " + (i + 1) + ": " + e.getMessage());
                skipped++;
            }
        }
        wb.close();

        return new CriteriaDto.ImportResult(saved.size(), skipped, errors,
                saved.stream().map(CriteriaDto.CriteriaResponse::from).collect(Collectors.toList()));
    }

    private EligibilityCriteria parseRow(Row row, String by) {
        String post = str(row, 0);
        if (post == null || post.isBlank()) return null;
        if (!ALL_POSTS.contains(post))
            throw new RuntimeException("Unknown post: '" + post + "'");

        return EligibilityCriteria.builder()
                .postName(post)
                // NET/SET/SLET
                .netSetSletRequirement(strDef(row, 1, "OR_PHD"))
                .netAccepted(bool(row, 2, true))
                .setAccepted(bool(row, 3, true))
                .sletAccepted(bool(row, 4, true))
                // Education
                .minPgPercentage(dbl(row, 5, 55.0))
                .phdRequired(bool(row, 6, false))
                // Experience
                .minTeachingExperienceYears(dbl(row, 7, 0.0))
                .minTotalExperienceYears(dbl(row, 8, 0.0))
                // API
                .minApiScore(intVal(row, 9, 0))
                // Publication minimums
                .minSciPublications(intVal(row, 10, 0))
                .minScopusPublications(intVal(row, 11, 0))
                .minUgcCarePublications(intVal(row, 12, 0))
                .minConferencePublications(intVal(row, 13, 0))
                .minLocalPublications(intVal(row, 14, 0))
                .minTotalIndexedPublications(intVal(row, 15, 0))
                // Weights
                .weightSciPublication(intVal(row, 16, 30))
                .weightScieCitation(intVal(row, 17, 5))
                .weightScopusPublication(intVal(row, 18, 20))
                .weightUgcCarePublication(intVal(row, 19, 10))
                .weightConferencePublication(intVal(row, 20, 5))
                .weightLocalPublication(intVal(row, 21, 2))
                .weightBookChapter(intVal(row, 22, 15))
                .weightTeachingExperiencePerYear(intVal(row, 23, 10))
                .maxTeachingExperiencePoints(intVal(row, 24, 100))
                // Bonuses
                .phdBonus(intVal(row, 25, 30))
                .netSetSletBonus(intVal(row, 26, 0))
                .pgBonusThreshold1(dbl(row, 27, 75.0))
                .pgBonus1(intVal(row, 28, 20))
                .pgBonusThreshold2(dbl(row, 29, 60.0))
                .pgBonus2(intVal(row, 30, 10))
                .active(true).activatedAt(LocalDateTime.now())
                .changeNote("Imported from Excel by " + by).createdBy(by)
                .build();
    }

    // ── Excel Template Generator ──────────────────────────────────────────────────

    public byte[] generateTemplate() throws IOException {
        Workbook wb = new XSSFWorkbook();
        Sheet sheet = wb.createSheet("Eligibility Criteria");
        Sheet info  = wb.createSheet("Instructions");

        // Styles
        CellStyle hStyle = wb.createCellStyle();
        hStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        hStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        Font hFont = wb.createFont(); hFont.setColor(IndexedColors.WHITE.getIndex()); hFont.setBold(true);
        hStyle.setFont(hFont); hStyle.setBorderBottom(BorderStyle.MEDIUM);

        CellStyle grpStyle = wb.createCellStyle();
        grpStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
        grpStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        Font gf = wb.createFont(); gf.setBold(true); grpStyle.setFont(gf);

        CellStyle dataStyle = wb.createCellStyle();
        dataStyle.setFillForegroundColor(IndexedColors.LEMON_CHIFFON.getIndex());
        dataStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        // Group header row (row 0)
        String[] groups = {
            "POST","NET/SET/SLET","","","","EDUCATION","","EXPERIENCE","","API SCORE",
            "MIN PUBLICATIONS","","","","","","WEIGHTS","","","","","","","","",
            "BONUSES","","","","",""
        };
        Row grpRow = sheet.createRow(0);
        for (int i = 0; i < groups.length; i++) {
            Cell cell = grpRow.createCell(i);
            cell.setCellValue(groups[i]);
            if (!groups[i].isBlank()) cell.setCellStyle(grpStyle);
        }

        // Column header row (row 1)
        String[] headers = {
            "post_name *",
            "net_set_slet_requirement\n(NONE|REQUIRED|OR_PHD)",
            "net_accepted\n(true/false)",
            "set_accepted\n(true/false)",
            "slet_accepted\n(true/false)",
            "min_pg_percentage",
            "phd_required\n(true/false)",
            "min_teaching_exp_years",
            "min_total_exp_years",
            "min_api_score",
            "min_sci_publications",
            "min_scopus_publications",
            "min_ugc_care_publications",
            "min_conference_publications",
            "min_local_publications",
            "min_total_indexed_publications",
            "weight_sci_publication",
            "weight_scie_citation",
            "weight_scopus_publication",
            "weight_ugc_care_publication",
            "weight_conference_publication",
            "weight_local_publication",
            "weight_book_chapter",
            "weight_teaching_exp_per_year",
            "max_teaching_exp_points",
            "phd_bonus",
            "net_set_slet_bonus",
            "pg_bonus_threshold_1",
            "pg_bonus_1",
            "pg_bonus_threshold_2",
            "pg_bonus_2"
        };
        Row hRow = sheet.createRow(1);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = hRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(hStyle);
            sheet.setColumnWidth(i, 5500);
        }

        // Default data rows
        Object[][] rows = {
            {"Assistant Professor","OR_PHD",true,true,true, 55.0,false, 0.0,0.0,0,   0,0,0,0,0,0, 30,5,20,10,5,2,15,10,100, 30,0,75.0,20,60.0,10},
            {"Associate Professor","OR_PHD",true,true,true, 55.0,true,  8.0,8.0,300, 0,0,0,0,0,3, 30,5,20,10,5,2,15,10,100, 30,0,75.0,20,60.0,10},
            {"Professor",          "OR_PHD",true,true,true, 55.0,true, 10.0,10.0,400,5,0,0,0,0,5, 30,5,20,10,5,2,15,10,100, 30,0,75.0,20,60.0,10},
            {"Principal/HOD",      "OR_PHD",true,true,true, 55.0,true, 15.0,15.0,400,5,0,0,0,0,5, 30,5,20,10,5,2,15,10,100, 30,0,75.0,20,60.0,10},
        };

        for (int r = 0; r < rows.length; r++) {
            Row row = sheet.createRow(r + 2);
            for (int col = 0; col < rows[r].length; col++) {
                Cell cell = row.createCell(col);
                Object v = rows[r][col];
                if (v instanceof String s)   cell.setCellValue(s);
                else if (v instanceof Boolean b) cell.setCellValue(b);
                else if (v instanceof Integer n) cell.setCellValue(n);
                else if (v instanceof Double d)  cell.setCellValue(d);
                cell.setCellStyle(dataStyle);
            }
        }

        // Instructions sheet
        String[] inst = {
            "INSTRUCTIONS — FCAS Eligibility Criteria Template",
            "",
            "COLUMN A: post_name",
            "  Must be exactly one of:",
            "  → Assistant Professor",
            "  → Associate Professor",
            "  → Professor",
            "  → Principal/HOD",
            "",
            "COLUMN B: net_set_slet_requirement",
            "  NONE     — NET/SET/SLET not required at all",
            "  REQUIRED — At least one qualifying exam is mandatory",
            "  OR_PHD   — Either qualifying exam OR PhD (UGC standard)",
            "",
            "COLUMNS C–E: net_accepted, set_accepted, slet_accepted",
            "  true/false — which exams are accepted for this post",
            "  Example: If only NET is valid, set net=true, set=false, slet=false",
            "",
            "COLUMNS F–G: min_pg_percentage, phd_required",
            "  min_pg_percentage: e.g. 55 for 55%",
            "  phd_required: true or false",
            "",
            "COLUMNS H–I: Experience (years)",
            "  Use decimals: 8.5 = 8 years 6 months",
            "  Set 0 if no minimum required",
            "",
            "COLUMN J: min_api_score — Set 0 if not required",
            "",
            "COLUMNS K–P: Minimum publications per category",
            "  Set 0 for any category not required",
            "  P = min_total_indexed = combined SCI+Scopus+UGC minimum",
            "",
            "COLUMNS Q–Y: API Score Weights",
            "  These define how many API points each activity earns",
            "  weight_teaching_exp_per_year × years (capped at max_teaching_exp_points)",
            "",
            "COLUMNS Z–AE: Bonus Points",
            "  phd_bonus: extra API points if PhD completed",
            "  net_set_slet_bonus: extra points if qualifying exam cleared",
            "  pg_bonus_threshold_1: if PG% >= this → add pg_bonus_1 to API score",
            "  pg_bonus_threshold_2: if PG% >= this → add pg_bonus_2 to API score",
            "",
            "IMPORTANT:",
            "  → Each row updates that post immediately when uploaded",
            "  → Old criteria are kept in version history (not deleted)",
            "  → You may include 1 to 4 rows (one per post)",
            "  → Do NOT rename this sheet or delete the header rows",
        };
        for (int i = 0; i < inst.length; i++) {
            Row r = info.createRow(i);
            Cell cell = r.createCell(0);
            cell.setCellValue(inst[i]);
            info.setColumnWidth(0, 25000);
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        wb.write(out); wb.close();
        return out.toByteArray();
    }

    // ── Default Seed ──────────────────────────────────────────────────────────────

    @Transactional
    public void seedDefaults() {
        if (!repo.findByActiveTrueOrderByPostName().isEmpty()) return;

        repo.saveAll(List.of(
            build("Assistant Professor", "OR_PHD", true,true,true, 55.0,false, 0.0,0.0, 0,  0,0,0,0,0,0),
            build("Associate Professor", "OR_PHD", true,true,true, 55.0,true,  8.0,8.0, 300,0,0,0,0,0,3),
            build("Professor",           "OR_PHD", true,true,true, 55.0,true, 10.0,10.0,400,5,0,0,0,0,5),
            build("Principal/HOD",       "OR_PHD", true,true,true, 55.0,true, 15.0,15.0,400,5,0,0,0,0,5)
        ));
        System.out.println("✅ Default eligibility criteria seeded (UGC norms).");
    }

    private EligibilityCriteria build(String post, String netReq,
            boolean net, boolean set, boolean slet,
            double pgPct, boolean phd,
            double teachExp, double totalExp,
            int minApi,
            int minSci, int minScopus, int minUgc, int minConf, int minLocal, int minTotal) {
        return EligibilityCriteria.builder()
                .postName(post).netSetSletRequirement(netReq)
                .netAccepted(net).setAccepted(set).sletAccepted(slet)
                .minPgPercentage(pgPct).phdRequired(phd)
                .minTeachingExperienceYears(teachExp).minTotalExperienceYears(totalExp)
                .minApiScore(minApi)
                .minSciPublications(minSci).minScopusPublications(minScopus)
                .minUgcCarePublications(minUgc).minConferencePublications(minConf)
                .minLocalPublications(minLocal).minTotalIndexedPublications(minTotal)
                .version(1).active(true).activatedAt(LocalDateTime.now())
                .changeNote("Default UGC norms seeded on startup").createdBy("system").build();
    }

    // ── Cell helpers ──────────────────────────────────────────────────────────────
    private boolean isRowEmpty(Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) return false;
        }
        return true;
    }
    private String str(Row row, int col) {
        Cell c = row.getCell(col);
        if (c == null) return null;
        return switch (c.getCellType()) {
            case STRING -> c.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) c.getNumericCellValue());
            default -> null;
        };
    }
    private String strDef(Row row, int col, String def) {
        String v = str(row, col);
        return (v == null || v.isBlank()) ? def : v;
    }
    private double dbl(Row row, int col, double def) {
        Cell c = row.getCell(col);
        if (c == null) return def;
        return switch (c.getCellType()) {
            case NUMERIC -> c.getNumericCellValue();
            case STRING -> { try { yield Double.parseDouble(c.getStringCellValue().trim()); } catch (Exception e) { yield def; } }
            default -> def;
        };
    }
    private int intVal(Row row, int col, int def) { return (int) dbl(row, col, def); }
    private boolean bool(Row row, int col, boolean def) {
        Cell c = row.getCell(col);
        if (c == null) return def;
        return switch (c.getCellType()) {
            case BOOLEAN -> c.getBooleanCellValue();
            case STRING -> c.getStringCellValue().trim().equalsIgnoreCase("true");
            case NUMERIC -> c.getNumericCellValue() != 0;
            default -> def;
        };
    }
}
