# FCAS — Eligibility Logic Notes
## How the Automatic Eligibility System Works
### (Prepared for Senior Review)

---

## 1. WHAT IS THE ELIGIBILITY ENGINE?

The Eligibility Engine is the core brain of FCAS. When a faculty member clicks
"Check Eligibility" or submits an application, this engine:

  1. Reads the faculty member's academic profile from the database
  2. Reads the eligibility rules for the selected post from the database
  3. Compares each rule against the profile, one by one
  4. Returns a PASS or FAIL for each rule
  5. If ALL rules pass → "Eligible". If ANY rule fails → "Not Eligible"

KEY POINT: There are NO hardcoded numbers in the system. Every rule
(percentages, years, scores, publication counts) is stored in the database
and can be changed by admin at any time without touching code.

---

## 2. THE FOUR POSTS SUPPORTED

  Post 1: Assistant Professor   (entry level)
  Post 2: Associate Professor   (mid level)
  Post 3: Professor             (senior level)
  Post 4: Principal / HOD       (head level)

Each post has its own completely separate set of rules in the database.

---

## 3. THE EIGHT ELIGIBILITY CHECKS

For every post, the system runs exactly these 8 checks in order:

  CHECK 1:  PG Degree present?
  CHECK 2:  PG Percentage >= minimum required?
  CHECK 3:  NET / SET / SLET status?
  CHECK 4:  PhD completed (if mandatory for that post)?
  CHECK 5:  Teaching experience >= minimum required?
  CHECK 6:  Total experience >= minimum required?
  CHECK 7:  Publication counts >= minimum per index?
  CHECK 8:  API Score >= minimum required?

If ALL 8 checks are satisfied → Eligible
If even ONE check fails → Not Eligible

The exact minimum value for each check is read from the database, not from code.

---

## 4. DEEP DIVE: NET / SET / SLET LOGIC (CHECK 3)

This is the most complex check. The admin configures one of three modes:

  MODE A — NONE
    The system skips the qualifying exam check entirely.
    No exam is required for this post.
    Example use: Principal/HOD post where PhD + experience is enough.

  MODE B — REQUIRED
    The candidate MUST have cleared at least one qualifying exam.
    PhD alone does NOT satisfy this requirement.
    If the candidate has no NET, SET, or SLET → FAIL.
    Example use: Strict enforcement mode, no exemptions.

  MODE C — OR_PHD  ← UGC Standard
    The candidate needs EITHER a qualifying exam OR a PhD.
    Logic:
      If candidate has NET or SET or SLET → PASS (exam satisfies it)
      If candidate has PhD (even without exam) → PASS (PhD exempts exam)
      If candidate has both exam AND PhD → PASS (strong candidate)
      If candidate has neither → FAIL

    This follows UGC Regulation 2018:
    "Candidates who have been awarded PhD degree in accordance with the
    UGC (Minimum Standards) Regulations 2009 shall be exempted from NET/SLET."

Admin also controls which specific exams are accepted:
  - NET accepted: Yes / No
  - SET accepted: Yes / No
  - SLET accepted: Yes / No

Example: If admin sets "NET accepted = Yes, SET accepted = No, SLET accepted = No"
then only NET counts. A candidate with only SET would still fail.

---

## 5. API SCORE — HOW IT IS CALCULATED

API = Academic Performance Indicator. It is a single number that summarizes
a faculty member's overall academic output.

The formula (all weights configurable by admin):

  API Score =
    (Teaching Years × points_per_year)        [capped at max]
  + (SCI papers × points_per_SCI_paper)
  + (SCI citations × points_per_citation)
  + (Scopus papers × points_per_Scopus_paper)
  + (UGC Care papers × points_per_UGC_paper)
  + (Conference papers × points_per_conf_paper)
  + (Local papers × points_per_local_paper)
  + (Books/Chapters × points_per_book)
  + (PhD bonus, if PhD completed)
  + (NET/SET/SLET bonus, if exam cleared)
  + (PG percentage bonus — tiered)

DEFAULT WEIGHTS (admin can change all of these):

  Activity                    | Points
  ----------------------------|--------
  Teaching experience         | 10 per year (max 100)
  SCI / SCIE publication      | 30 each
  SCI / SCIE citation         | 5 each
  Scopus publication          | 20 each
  UGC Care publication        | 10 each
  Conference paper            | 5 each
  Local / other journal       | 2 each
  Book / book chapter         | 15 each
  PhD completed               | +30 bonus
  NET/SET/SLET cleared        | +0 (default, admin can set bonus)
  PG % >= 75%                 | +20 bonus
  PG % >= 60% (but < 75%)     | +10 bonus

EXAMPLE CALCULATION:
  Faculty member has:
  - 9 years teaching         = 9 × 10 = 90 points
  - 2 SCI papers             = 2 × 30 = 60 points
  - 5 Scopus papers          = 5 × 20 = 100 points
  - 3 conference papers      = 3 × 5  = 15 points
  - PhD completed            = +30
  - PG = 72%                 = +10 (crosses 60% threshold)
                             ─────────────
  TOTAL API SCORE            = 305 points

---

## 6. DEFAULT CRITERIA FOR ALL FOUR POSTS

These are the UGC norms pre-loaded when the system starts for the first time.
Admin can change any of these values from the Admin Panel at any time.

  ┌─────────────────────┬──────────────┬────────┬──────────┬──────────┬───────────┬─────────────┐
  │ Post                │ NET/SET/SLET │ Min PG │ PhD      │ Min Teach│ Min API   │ Min Indexed │
  │                     │ Requirement  │ %      │ Required │ Exp      │ Score     │ Publications│
  ├─────────────────────┼──────────────┼────────┼──────────┼──────────┼───────────┼─────────────┤
  │ Assistant Professor │ OR_PHD       │ 55%    │ No       │ 0 years  │ 0         │ 0           │
  │ Associate Professor │ OR_PHD       │ 55%    │ Yes      │ 8 years  │ 300       │ 3 combined  │
  │ Professor           │ OR_PHD       │ 55%    │ Yes      │ 10 years │ 400       │ 5 SCI/Scopus│
  │ Principal / HOD     │ OR_PHD       │ 55%    │ Yes      │ 15 years │ 400       │ 5 SCI/Scopus│
  └─────────────────────┴──────────────┴────────┴──────────┴──────────┴───────────┴─────────────┘

Note: "Indexed Publications" means SCI + Scopus + UGC Care combined total.

---

## 7. WHAT HAPPENS WHEN A FACULTY SUBMITS AN APPLICATION

Step 1: Faculty clicks "Apply for Post" and selects a post.

Step 2: System immediately runs all 8 eligibility checks using:
        - Faculty's saved profile data
        - The currently active criteria for that post from database

Step 3: System generates a detailed eligibility report:
        ✅ Met Criteria: list of things the candidate satisfies
        ❌ Unmet Criteria: list of things the candidate is missing
        API Score: exact score with breakdown

Step 4: This report is saved permanently with the application.
        IMPORTANT: The criteria version number is also saved.
        This means even if admin changes the rules tomorrow,
        the old application's eligibility result does not change.

Step 5: Application appears in admin panel with:
        - Green badge: Eligible
        - Red badge:   Not Eligible
        Along with the full eligibility report

Step 6: Admin reviews the application, reads the report, views uploaded
        documents, and writes remarks. Then sets status to:
        PENDING → UNDER_REVIEW → APPROVED / REJECTED

Step 7: Faculty can see the admin's remarks and final decision in
        "My Applications" page.

---

## 8. WHAT ADMIN CAN CHANGE FROM THE CRITERIA PANEL

Admin can go to Admin Panel → ⚙️ Eligibility Criteria and change:

  QUALIFYING EXAM SETTINGS:
  ✎ NET/SET/SLET requirement mode (NONE / REQUIRED / OR_PHD)
  ✎ Which exams are accepted (NET: yes/no, SET: yes/no, SLET: yes/no)
  ✎ Bonus API points for clearing exam

  EDUCATION REQUIREMENTS:
  ✎ Minimum PG percentage (default 55%)
  ✎ Whether PhD is mandatory (yes/no)

  EXPERIENCE REQUIREMENTS:
  ✎ Minimum teaching experience years
  ✎ Minimum total experience years

  API SCORE:
  ✎ Minimum API score required

  PUBLICATION MINIMUMS:
  ✎ Minimum SCI publications
  ✎ Minimum Scopus publications
  ✎ Minimum UGC Care publications
  ✎ Minimum conference papers
  ✎ Minimum local publications
  ✎ Minimum total indexed publications (combined)

  API SCORE WEIGHTS (points per unit):
  ✎ Points per SCI paper, Scopus paper, UGC paper, etc.
  ✎ Points per year of teaching experience
  ✎ Maximum points from teaching experience
  ✎ PhD bonus points
  ✎ PG percentage bonus thresholds and points

Every change:
  - Takes effect IMMEDIATELY for new eligibility checks
  - Creates a new version number in the database
  - Old versions are preserved in version history
  - Admin can roll back to any previous version with one click
  - The change note (reason) is recorded for audit trail

---

## 9. VERSION CONTROL — WHY IT MATTERS

Every time admin saves new criteria, the system:
  - Creates a new row in the database with version number (v1, v2, v3...)
  - Records WHO made the change (admin email)
  - Records WHEN it was changed (timestamp)
  - Records WHY it was changed (change note / reason)
  - Keeps all old versions permanently

This means:
  - Any application submitted before a criteria change uses the OLD criteria
  - You can always see exactly what rules were in effect when any application was submitted
  - You can audit who changed what and when
  - You can roll back to UGC defaults at any time

---

## 10. TWO WAYS TO UPDATE CRITERIA

WAY 1 — Admin Panel Form:
  Login as admin → Eligibility Criteria → Select post → Edit fields → Save
  Best for: Changing one or two values for one post at a time

WAY 2 — Excel Upload:
  Download template (.xlsx) → Edit all 4 posts in Excel → Upload back
  Best for: Bulk updates when implementing a new UGC circular,
            updating all posts at once after a policy revision

The Excel template has 31 columns covering every configurable field.
An Instructions sheet is included explaining each column.

---

## 11. ELIGIBILITY CHECK vs APPLICATION SUBMISSION

The system has two separate actions:

  CHECK ELIGIBILITY (no application created):
  - Faculty goes to "Check Eligibility" page
  - Selects a post
  - System runs checks and shows result
  - Nothing is saved or submitted
  - Faculty can check multiple posts freely
  - Useful to understand gaps before formally applying

  SUBMIT APPLICATION (creates a permanent record):
  - Faculty goes to "Apply for Post" page
  - Selects post, reviews eligibility, confirms
  - Application is created in the database
  - Eligibility result is permanently saved with this application
  - Application goes to admin panel for review
  - Faculty can track status and see admin feedback

A faculty member can submit an application even if NOT currently eligible.
The ineligible status is recorded and shown to admin, who can review
extenuating circumstances and still approve if needed.

---

## 12. DATA FLOW DIAGRAM

  Faculty fills profile
         ↓
  Profile saved in: faculty_profiles table
  (UG, PG, PhD, NET/SET/SLET, Experience, Publications)
         ↓
  Faculty selects a post to check / apply
         ↓
  EligibilityEngine reads:
    → Faculty profile from faculty_profiles
    → Active criteria for that post from eligibility_criteria
         ↓
  Engine runs 8 checks, calculates API score
         ↓
  Returns: eligible (true/false) + met criteria list + unmet criteria list + API score
         ↓
  If applying: Application saved in applications table
  Stores: faculty data snapshot + eligibility result + criteria version used
         ↓
  Admin sees application in admin panel
  Admin reads eligibility report + views uploaded documents
  Admin writes remarks + sets status (APPROVED / REJECTED)
         ↓
  Faculty sees final decision + admin remarks in My Applications page

---

## 13. DOCUMENT UPLOAD SYSTEM

Alongside the eligibility form, faculty can upload supporting documents:
  - PhD Certificate
  - NET/SET/SLET Scorecard / Certificate
  - Experience Certificates
  - UG / PG Marksheets
  - Publication Proof (journal acceptance letters, etc.)
  - Appointment Letter
  - Any other document (PDF or image, max 10MB each)

All documents are stored on the server.
Admin can view / download every document while reviewing an application.
This makes the process completely paperless.

---

## SUMMARY FOR SENIORS

The FCAS eligibility system works as follows:

  1. Admin sets rules in the database (via form or Excel)
  2. Faculty fills their academic profile (including NET/SET/SLET status)
  3. When faculty checks eligibility or applies, the system automatically
     compares their profile against the database rules
  4. The system gives a detailed, transparent report showing exactly which
     criteria pass and which fail, and why
  5. Admin reviews applications with full profile visibility and uploaded
     documents, then gives a formal decision with written remarks
  6. Every criteria change is versioned and auditable
  7. No code changes are needed to update eligibility rules — admin
     can do it entirely from the web interface

The system follows UGC Regulations 2018 and AICTE norms for engineering
colleges by default, while remaining fully configurable for institution-specific
policies.
