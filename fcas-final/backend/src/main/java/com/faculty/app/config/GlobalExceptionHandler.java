package com.faculty.app.config;

import com.faculty.app.dto.CriteriaDto;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<CriteriaDto.MessageResponse> handleRuntime(RuntimeException ex) {
        return ResponseEntity.badRequest().body(new CriteriaDto.MessageResponse(ex.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<CriteriaDto.MessageResponse> handleBadCreds(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new CriteriaDto.MessageResponse("Invalid email or password."));
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<CriteriaDto.MessageResponse> handleDisabled(DisabledException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new CriteriaDto.MessageResponse("Your account has been deactivated. Contact admin."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<CriteriaDto.MessageResponse> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage).collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(new CriteriaDto.MessageResponse(msg));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<CriteriaDto.MessageResponse> handleAll(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new CriteriaDto.MessageResponse("Server error: " + ex.getMessage()));
    }
}
