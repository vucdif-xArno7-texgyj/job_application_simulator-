package com.jobtracker.repository;

import com.jobtracker.model.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;

// Extending JpaRepository gives you findAll(), save(), deleteById(), findById()
// for free -- no SQL needed for basic operations.
public interface JobRepository extends JpaRepository<JobApplication, Long> {
}
