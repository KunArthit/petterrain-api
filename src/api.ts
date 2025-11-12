import { Elysia } from "elysia";

import { auth } from "./auth";
import wpUserController from "./controllers/UserController";
import wpProductsController from "./controllers/ProductsController";
import wpBlogController from "./controllers/BlogController";
import wpUserTypeController from "./controllers/UserTypeController";
import wpUserAddressController from "./controllers/UserAddressController";
import wpBlogCategoryController from "./controllers/BlogCategoryController";
import wpBlogPostMediaController from "./controllers/BlogPostMediaController";
import wpProductImageController from "./controllers/ProductImageController";
import wpChatbotResponseController from "./controllers/ChatbotResponseController";
import wpAdminPermissionsController from "./controllers/AdminPermissionsController";
import wpCreditTermsController from "./controllers/CreditTermController";
import wpOrderController from "./controllers/OrderController";
import wpInvoiceController from "./controllers/InvoiceController";
import wpPaymentTransactionController from "./controllers/PaymentTransactionController";
import wpChatMessageController from "./controllers/ChatMessageController";
import wpChatSessionController from "./controllers/ChatSessionController";
import wpDapartmentsController from "./controllers/DepartmentController";
import wpProductvideoController from "./controllers/ProductVideoController";
import wpHotProductController from "./controllers/HotProductController";
import wpOrderItemController from "./controllers/OrderItemController";
import wpSolutionCategoryController from "./controllers/SolutionCategoryController";
import wpProjectExampleController from "./controllers/ProjectExampleController";
import wpSolutionContentController from "./controllers/SolutionContentController";
import wpProjectMediaController from "./controllers/ProjectMediaController";
import wpCompanyContactController from "./controllers/CompanyContactController";
import { fileController } from "./controllers/fileController";
import productCategoryController from "./controllers/ProductCatagoriesController";
import { AuthController } from "./controllers/AuthController";
import MediaController from "./controllers/MediaController";
import themeController from "./controllers/ThemeController";
import reportController from "./controllers/ReportController";
import { chatController } from "./controllers/chatController";
import paymentController from "./controllers/paymentController";
import { userRoutes } from "./controllers/user2";
import financeController from "./controllers/financeController";
import solutionMediaController from "./controllers/SolutionMediaController";
import bankTransferController from "./controllers/BankController";
import cartWishlistController from "./controllers/CartWishlistController";

export const apiRouter = <T extends string>(config: { prefix: T }) => {
  const controllers = [
    wpUserController,
    wpProductsController,
    wpBlogController,
    wpUserTypeController,
    wpUserAddressController,
    wpBlogCategoryController,
    wpBlogPostMediaController,
    wpProductImageController,
    wpChatbotResponseController,
    wpAdminPermissionsController,
    wpCreditTermsController,
    wpOrderController,
    wpInvoiceController,
    wpPaymentTransactionController,
    wpChatMessageController,
    wpChatSessionController,
    wpDapartmentsController,
    wpProductvideoController,
    wpHotProductController,
    wpOrderItemController,
    wpSolutionCategoryController,
    wpProjectExampleController,
    wpSolutionContentController,
    wpProjectMediaController,
    wpCompanyContactController,
    cartWishlistController,
    fileController,
    productCategoryController,
    AuthController,
    MediaController,
    themeController,
    reportController,
    chatController,
    paymentController,
    userRoutes,
    financeController,
    solutionMediaController,
    bankTransferController,
  ];

  let app = new Elysia({
    prefix: config.prefix,
    name: "api",
    seed: config,
  });

  // Apply all controllers dynamically
  controllers.forEach((controller) => {
    app = app.use(controller);
  });

  // return app.guard((app) => app.use(auth)) as unknown as Elysia;
  return app;
};
