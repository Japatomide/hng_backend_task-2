/**
 * Build MongoDB query from filter parameters
 */
const buildFilterQuery = (queryParams) => {
  const filter = {};

  // Exact matches
  if (queryParams.gender) {
    const gender = queryParams.gender.toLowerCase();
    if (gender === "male" || gender === "female") {
      filter.gender = gender;
    }
  }

  if (queryParams.age_group) {
    const validGroups = ["child", "teenager", "adult", "senior"];
    if (validGroups.includes(queryParams.age_group.toLowerCase())) {
      filter.age_group = queryParams.age_group.toLowerCase();
    }
  }

  if (queryParams.country_id) {
    filter.country_id = queryParams.country_id.toUpperCase();
  }

  // Range filters
  if (queryParams.min_age !== undefined) {
    const minAge = parseInt(queryParams.min_age);
    if (!isNaN(minAge) && minAge >= 0) {
      filter.age = { ...filter.age, $gte: minAge };
    }
  }

  if (queryParams.max_age !== undefined) {
    const maxAge = parseInt(queryParams.max_age);
    if (!isNaN(maxAge) && maxAge >= 0) {
      filter.age = { ...filter.age, $lte: maxAge };
    }
  }

  // Probability filters
  if (queryParams.min_gender_probability !== undefined) {
    const minProb = parseFloat(queryParams.min_gender_probability);
    if (!isNaN(minProb) && minProb >= 0 && minProb <= 1) {
      filter.gender_probability = { $gte: minProb };
    }
  }

  if (queryParams.min_country_probability !== undefined) {
    const minProb = parseFloat(queryParams.min_country_probability);
    if (!isNaN(minProb) && minProb >= 0 && minProb <= 1) {
      filter.country_probability = { $gte: minProb };
    }
  }

  return filter;
};

/**
 * Build sort object for MongoDB
 */
const buildSortObject = (sortBy, order) => {
  const allowedSortFields = ["age", "created_at", "gender_probability"];
  if (!sortBy || !allowedSortFields.includes(sortBy)) {
    return { created_at: -1 }; // default sort
  }

  const sortOrder = order && order.toLowerCase() === "asc" ? 1 : -1;
  return { [sortBy]: sortOrder };
};

/**
 * Validate and extract pagination parameters
 */
const getPaginationParams = (page, limit) => {
  let pageNum = parseInt(page);
  let limitNum = parseInt(limit);

  if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
  if (isNaN(limitNum) || limitNum < 1) limitNum = 10;
  if (limitNum > 50) limitNum = 50;

  const skip = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, skip };
};

/**
 * Validate query parameters for /api/profiles endpoint
 */
const validateQueryParams = (params) => {
  // Check for invalid parameter names (optional enhancement)
  const allowedParams = [
    "gender",
    "age_group",
    "country_id",
    "min_age",
    "max_age",
    "min_gender_probability",
    "min_country_probability",
    "sort_by",
    "order",
    "page",
    "limit",
  ];

  for (const key of Object.keys(params)) {
    if (!allowedParams.includes(key)) {
      return false;
    }
  }

  // Validate enum values
  if (
    params.gender &&
    !["male", "female"].includes(params.gender.toLowerCase())
  ) {
    return false;
  }

  if (
    params.age_group &&
    !["child", "teenager", "adult", "senior"].includes(
      params.age_group.toLowerCase(),
    )
  ) {
    return false;
  }

  if (
    params.sort_by &&
    !["age", "created_at", "gender_probability"].includes(params.sort_by)
  ) {
    return false;
  }

  if (params.order && !["asc", "desc"].includes(params.order.toLowerCase())) {
    return false;
  }

  return true;
};

export {
  buildFilterQuery,
  buildSortObject,
  getPaginationParams,
  validateQueryParams,
};
