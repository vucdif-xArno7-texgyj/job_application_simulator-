package com.jobtracker.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

// This class is the "shape" of one row in the database.
// Each field becomes a column in the "job_application" table.
@Entity
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String company;
    private String role;
    private String stage;   // "applied" | "interview" | "offer" | "rejected"
    private String notes;
    private String date;    // stored as a simple string like "07/20"

    // JPA requires an empty constructor
    public JobApplication() {}

    public JobApplication(String company, String role, String stage, String notes, String date) {
        this.company = company;
        this.role = role;
        this.stage = stage;
        this.notes = notes;
        this.date = date;
    }

    // Getters and setters -- Spring uses these to convert to/from JSON automatically
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
}
