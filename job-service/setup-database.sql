-- Job Service Database Setup Script
-- Run this in PostgreSQL to create the database

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE job_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'job_db')\gexec

-- Connect to job_db database
\c job_db;

-- The tables will be created by Prisma migrations
