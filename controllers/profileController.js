import Profile from "../models/Profile.js";
import {
  buildFilterQuery,
  buildSortObject,
  getPaginationParams,
  validateQueryParams,
} from "../utils/filterBuilder.js";
import parseNaturalLanguage from "../utils/nlpParser.js";

/**
 * GET /api/profiles
 * Advanced filtering, sorting, pagination
 */
const getProfiles = async (req, res) => {
  try {
    // Validate query parameters
    if (!validateQueryParams(req.query)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid query parameters",
      });
    }

    // Build filter, sort, pagination
    const filter = buildFilterQuery(req.query);
    const sort = buildSortObject(req.query.sort_by, req.query.order);
    const { page, limit, skip } = getPaginationParams(
      req.query.page,
      req.query.limit,
    );

    // Execute queries in parallel
    const [data, total] = await Promise.all([
      Profile.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Profile.countDocuments(filter),
    ]);

    // Transform data to include id field (already there via schema)
    const formattedData = data.map((profile) => ({
      ...profile,
      created_at: profile.created_at.toISOString(),
    }));

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: "success",
      page,
      limit,
      total,
      total_pages: totalPages,
      has_more: page * limit < total,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getProfiles:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

/**
 * GET /api/profiles/:id
 * Get single profile by UUID v7 id
 */
const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await Profile.findOne({ id }).lean();

    if (!profile) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        ...profile,
        created_at: profile.created_at.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in getProfileById:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

/**
 * GET /api/profiles/search
 * Natural language query with pagination and sorting
 */
const searchProfiles = async (req, res) => {
  try {
    const { q, page, limit, sort_by, order } = req.query;

    // Validate natural language query
    if (!q || typeof q !== "string" || q.trim().length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Missing or empty query parameter",
      });
    }

    // Parse natural language to filters
    const parsedFilters = parseNaturalLanguage(q);

    if (!parsedFilters) {
      return res.status(422).json({
        status: "error",
        message: "Unable to interpret query",
      });
    }

    // Apply pagination and sorting (optional for search endpoint)
    const {
      page: pageNum,
      limit: limitNum,
      skip,
    } = getPaginationParams(page, limit);
    const sort = buildSortObject(sort_by, order);

    // Convert parsed filters to MongoDB query
    const filters = buildFilterQuery(parsedFilters);

    // Execute queries
    const [data, total] = await Promise.all([
      Profile.find(filters).sort(sort).skip(skip).limit(limitNum).lean(),
      Profile.countDocuments(filters),
    ]);

    const formattedData = data.map((profile) => ({
      ...profile,
      created_at: profile.created_at.toISOString(),
    }));

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      status: "success",
      page: pageNum,
      limit: limitNum,
      total,
      total_pages: totalPages,
      has_more: pageNum * limitNum < total,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in searchProfiles:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export { getProfiles, getProfileById, searchProfiles };
