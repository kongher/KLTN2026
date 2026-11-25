function parsePagination(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 10));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

function buildPagination(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
  };
}

function parseSort(query = {}, allowed = ["createdAt", "name", "price"]) {
  const sortBy = allowed.includes(query.sortBy) ? query.sortBy : "createdAt";
  const order = query.order === "asc" ? "asc" : "desc";
  return { [sortBy]: order };
}

module.exports = {
  parsePagination,
  buildPagination,
  parseSort,
};
