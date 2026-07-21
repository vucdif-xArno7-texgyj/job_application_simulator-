package com.jobtracker.controller;

import com.jobtracker.model.JobApplication;
import com.jobtracker.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

// @RestController = every method's return value gets turned into JSON automatically
// @CrossOrigin = allows the React dev server (different port) to call this API
@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "http://localhost:5173")
public class JobController {

    @Autowired
    private JobRepository repo;

    // GET /api/applications -> list everything
    @GetMapping
    public List<JobApplication> getAll() {
        return repo.findAll();
    }

    // POST /api/applications -> add a new one
    // Expects JSON body: { "company": "...", "role": "..." }
    @PostMapping
    public JobApplication add(@RequestBody Map<String, String> body) {
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM"));
        JobApplication app = new JobApplication(
                body.get("company"),
                body.get("role"),
                "applied",   // every new application starts at "applied"
                "",
                today
        );
        return repo.save(app);
    }

    // PUT /api/applications/{id}/stage -> move to a new stage
    // Expects JSON body: { "stage": "interview" }
    @PutMapping("/{id}/stage")
    public JobApplication moveStage(@PathVariable Long id, @RequestBody Map<String, String> body) {
        JobApplication app = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));
        app.setStage(body.get("stage"));
        return repo.save(app);
    }

    // PUT /api/applications/{id}/notes -> edit the notes field
    // Expects JSON body: { "notes": "..." }
    @PutMapping("/{id}/notes")
    public JobApplication updateNotes(@PathVariable Long id, @RequestBody Map<String, String> body) {
        JobApplication app = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));
        app.setNotes(body.get("notes"));
        return repo.save(app);
    }

    // DELETE /api/applications/{id} -> remove it
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }
}
