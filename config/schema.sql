-- SkillThali Database Schema
-- Run this file once to set up all tables

CREATE DATABASE IF NOT EXISTS skillthali;
USE skillthali;

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(100)  NOT NULL,
  email     VARCHAR(150)  NOT NULL UNIQUE,
  password  VARCHAR(255)  NOT NULL,
  role      ENUM('student', 'client') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200)  NOT NULL,
  description TEXT          NOT NULL,
  budget      DECIMAL(10,2) NOT NULL DEFAULT 0,
  clientEmail VARCHAR(150)  NOT NULL,
  status      ENUM('available', 'in-progress', 'completed') NOT NULL DEFAULT 'available',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Applications
CREATE TABLE IF NOT EXISTS applications (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  taskId       INT          NOT NULL,
  studentEmail VARCHAR(150) NOT NULL,
  status       ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  applied_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE KEY unique_application (taskId, studentEmail)
);

-- 4. Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  taskId       INT           NOT NULL,
  clientEmail  VARCHAR(150)  NOT NULL,
  studentEmail VARCHAR(150)  NOT NULL,
  amount       DECIMAL(10,2) NOT NULL,
  status       ENUM('pending', 'paid') NOT NULL DEFAULT 'pending',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Skills
CREATE TABLE IF NOT EXISTS skills (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  studentEmail VARCHAR(150) NOT NULL,
  skillName    VARCHAR(100) NOT NULL,
  INDEX idx_student_email (studentEmail)
);
