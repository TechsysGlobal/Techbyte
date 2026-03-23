-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "productCategory" TEXT NOT NULL,
    "tags" TEXT,
    "published" BOOLEAN DEFAULT true,
    "variantSku" TEXT NOT NULL,
    "variantInventoryQty" INTEGER DEFAULT 0,
    "variantPrice" DECIMAL(10,2) NOT NULL,
    "imageSrc" TEXT,
    "imagePosition" INTEGER,
    "brand" TEXT,
    "color" TEXT,
    "inBox" TEXT,
    "model" TEXT,
    "region" TEXT,
    "sim" TEXT,
    "storage" TEXT,
    "warranty" TEXT,
    "status" TEXT NOT NULL,
    "ordered" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyPhone" TEXT NOT NULL,
    "companyAddr" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "regCertUrl" TEXT,
    "bankName" TEXT NOT NULL,
    "bankAddress" TEXT NOT NULL,
    "bankCountry" TEXT NOT NULL,
    "bankIban" TEXT NOT NULL,
    "ceoName" TEXT NOT NULL,
    "ceoPhone" TEXT NOT NULL,
    "ceoEmail" TEXT NOT NULL,
    "salesName" TEXT NOT NULL,
    "salesEmail" TEXT NOT NULL,
    "salesPhone" TEXT NOT NULL,
    "purchaseName" TEXT NOT NULL,
    "purchaseEmail" TEXT NOT NULL,
    "purchasePhone" TEXT NOT NULL,
    "logisticName" TEXT NOT NULL,
    "logisticPhone" TEXT NOT NULL,
    "personalName" TEXT NOT NULL,
    "personalPhone" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "vatPrice" DECIMAL(10,2) NOT NULL,
    "shippingPrice" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currentStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priceAtSale" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_handle_key" ON "Product"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");


