import express from "express";
import Product from "../models/products.js";
import { protect, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// @desc    Get all products
// @route   GET /api/products
// @access  Public
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};

    // Apply filters
    if (req.query.category) {
      filter.category = new RegExp(req.query.category, "i");
    }
    if (req.query.brand) {
      filter.brand = new RegExp(req.query.brand, "i");
    }
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice)
        filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice)
        filter.price.$lte = parseFloat(req.query.maxPrice);
    }
    if (req.query.inStock === "true") {
      filter.inStock = true;
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
router.get("/search", optionalAuth, async (req, res, next) => {
  try {
    const { q: query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const products = await Product.find({
      $text: { $search: query },
    })
      .sort({ score: { $meta: "textScore" } })
      .limit(20);

    res.json({
      success: true,
      data: {
        products,
        total: products.length,
        query,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const product = await Product.findOne({ id: req.params.id });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
