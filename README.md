# Intelligence Query Engine API

A production-ready backend system that transforms basic CRUD operations into a powerful queryable intelligence engine with advanced filtering, sorting, pagination, and natural language search.

## Features

- **Advanced Filtering**: Multi-condition filters on gender, age, age_group, country, and probability scores
- **Sorting**: Sort by age, creation date, or gender probability (asc/desc)
- **Pagination**: Efficient pagination with configurable page size (max 50)
- **Natural Language Search**: Rule-based parser that converts plain English to structured queries
- **Validation**: Comprehensive input validation with proper error responses
- **Performance**: Optimized MongoDB indexes to handle 2000+ records efficiently
- **CORS Enabled**: Accessible from any frontend origin

## Tech Stack

- **Node.js** + **Express** - Backend framework
- **MongoDB** + **Mongoose** - Database and ODM
- **UUID v7** - Time-ordered unique identifiers
- **CORS** - Cross-origin resource sharing

## Installation

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)

### Setup

1. Clone the repository

```bash
git clone <your-repo-url>
cd intelligence-query-engine
```

2. Install dependencies

```bash
npm install
```

3. Start the server

```bash
npm start
```

## Usage

The API is available under `http://localhost:3000/api` by default.

### Available Endpoints

- `GET /api/profiles`
  - Supports filtering, sorting, pagination, and query validation.
  - Example: `/api/profiles?gender=male&country_id=NG&min_age=25&sort_by=age&order=desc&page=1&limit=10`

- `GET /api/profiles/search`
  - Supports natural language search via `q`.
  - Example: `/api/profiles/search?q=young males from kenya&page=1&limit=10`

- `GET /api/profiles/:id`
  - Returns a single profile by UUID.

- `GET /api/health`
  - Health check endpoint.

## Natural Language Search Examples

The search endpoint understands phrases like:

- `young males`
- `females above 30`
- `adult males from kenya`
- `male and female teenagers above 17`

## Response Format

Search and filtering endpoints return paginated responses with:

- `status`
- `page`
- `limit`
- `total`
- `total_pages`
- `has_more`
- `data`

## Notes

- Pagination enforces a maximum limit of `50`.
- Natural language queries are converted into structured MongoDB filters.
- Invalid query parameters return `400` responses.
