const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const categoryService = require("../services/categoryService");

const list = asyncHandler(async (req, res) => {
  const data = await categoryService.listCategories({
    role: req.user?.role,
    status: req.query.status,
  });
  return success(res, "Categories fetched", data);
});

const getById = asyncHandler(async (req, res) => {
  const data = await categoryService.getCategoryById(req.params.id, req.user?.role);
  return success(res, "Category fetched", data);
});

const create = asyncHandler(async (req, res) => {
  const data = await categoryService.createCategory(req.body);
  return success(res, "Category created", data, 201);
});

const update = asyncHandler(async (req, res) => {
  const data = await categoryService.updateCategory(req.params.id, req.body);
  return success(res, "Category updated", data);
});

const remove = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  return success(res, "Category deleted");
});

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};
