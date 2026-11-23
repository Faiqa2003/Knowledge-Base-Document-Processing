# Knowledge Base Document Processing Automation

An automated document processing workflow built using n8n to validate uploaded documents, identify file formats, extract document content, and standardize the results for further knowledge base processing.

## Overview

This project automates the initial document ingestion and processing pipeline for a knowledge base system.

Users upload documents through an n8n form, and the workflow validates the input before routing files to the appropriate processing path.

## Workflow Architecture

1. Document Upload Form Trigger
2. Validate and Identify File
3. Input Validation
4. Route by File Type
5. Extract Document Content
6. Standardize Successful Results

## Supported File Formats

- PDF
- Excel
- CSV
- TXT
- DOCX
- PPTX
- Images (OCR processing)

Unsupported file formats are handled through a separate response path.

## Technologies Used

- n8n – Workflow automation
- Apache Tika – Document text extraction
- OCR – Image text extraction
- JavaScript – Data validation and transformation
- Webhooks and Forms – Document input handling

## Key Features

- Automated document upload
- File validation and identification
- Conditional routing based on file type
- Document text extraction
- OCR processing for images
- Standardized processing output
- Error handling for invalid and unsupported files

## Workflow Export

The `workflow.json` file contains the exported n8n workflow.

## Setup

1. Import the workflow JSON into your n8n instance.
2. Configure the required credentials and services.
3. Configure the Apache Tika service if required.
4. Test the document upload form.
5. Upload supported documents and verify the output.

## Project Status

Completed – Document ingestion, validation, file routing, and content extraction workflow.

## Author

Developed as an automation and knowledge base engineering project.
