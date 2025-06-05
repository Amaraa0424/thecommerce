"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsersManagement } from "@/components/admin/users-management"
import { OrdersManagement } from "@/components/admin/orders-management"
import { CategoriesManagement } from "@/components/admin/categories-management"
import { ProductsManagement } from "@/components/admin/products-management"
import { Package, Users, FolderOpen, ShoppingBag } from "lucide-react"

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("orders")

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your eCommerce store with comprehensive admin tools</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="orders" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Orders</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center space-x-2">
            <ShoppingBag className="h-4 w-4" />
            <span>Products</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center space-x-2">
            <FolderOpen className="h-4 w-4" />
            <span>Categories</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          <OrdersManagement />
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <ProductsManagement />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <CategoriesManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}