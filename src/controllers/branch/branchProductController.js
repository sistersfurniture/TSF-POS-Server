import ErrorHandler from "../../middlewares/error/errorHandler.js";
import Branch from "../../models/branchModel.js";
import catchAsyncError from "../../utils/catchAsyncError.js";

export const addProductToBranch = catchAsyncError(async (req, res, next) => {
  const { branchId } = req.params;

  //getting product from request body
  const { product } = req.body;

  //   sending error if there is no product in req body
  if (!product) return next(new ErrorHandler(400, "Product Required"));

  // Check if the product exists in the branch model
  const branch = await Branch.findOne({
    _id: branchId,
    "products.id": product.id,
  });

  //   sending error if there is already a product with the same id
  if (branch) {
    return res
      .status(400)
      .json({ message: "Product already exists in the branch" });
  }

  await Branch.findByIdAndUpdate(
    branchId,
    { $addToSet: { products: product } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    branch,
  });
});

// Controller function to delete a product from branch
export const deleteProductFromBranch = catchAsyncError(
  async (req, res, next) => {
    // getting branch id from params
    const { branchId } = req.params;

    // getting product id from request body
    const { product } = req.body;

    // throwing error if product id is not available
    if (!product)
      return res.status(400).json({ message: "Product Id Required" });

    /**
     * Searching for the branch with the branch id and if
     * branch available pull the product which match product id
     * we provided
     */
    const branch = await Branch.findByIdAndUpdate(
      branchId,
      {
        $pull: { products: { id: product } },
      },
      { new: true }
    );

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }
    res.status(200).json({
      success: true,
      branch,
    });
  }
);

export const changeProductQuantity = catchAsyncError(async (req, res, next) => {
  const { branchId } = req.params;
  const { product, quantity } = req.body;

  //  throwing error if product id or quantity isn't available
  if (!product || !quantity)
    return next(new ErrorHandler("Product id and quantity required"));

  // updating the product quantity on branch.products = [] array
  const branch = await Branch.updateOne(
    { _id: branchId, "products.id": product },
    { $set: { "products.$.quantity": quantity } }
  );

  //   if product count is same as previous throwing error
  if (branch.modifiedCount === 0)
    return next(new ErrorHandler(400, "Can't update product stock"));

  // sending response back to client
  res.status(200).json({
    success: true,
    message: "Stock Updated",
  });
});
