
"use client"

import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Search, 
  Settings, 
  LogOut,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function AdminDashboard() {
  const stats = [
    { title: 'Total Revenue', value: '$124,592', change: '+12.5%', isUp: true },
    { title: 'Active Orders', value: '456', change: '+18%', isUp: true },
    { title: 'New Customers', value: '1,234', change: '-2.4%', isUp: false },
    { title: 'Conversion Rate', value: '3.2%', change: '+0.5%', isUp: true },
  ];

  const recentOrders = [
    { id: '#ORD-7892', customer: 'John Doe', amount: '$299.00', status: 'Delivered', date: '2 mins ago' },
    { id: '#ORD-7891', customer: 'Sarah Miller', amount: '$156.40', status: 'Processing', date: '15 mins ago' },
    { id: '#ORD-7890', customer: 'Michael Chen', amount: '$1,299.00', status: 'Pending', date: '1 hour ago' },
    { id: '#ORD-7889', customer: 'Emma Watson', amount: '$45.00', status: 'Shipped', date: '3 hours ago' },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r bg-white hidden lg:flex flex-col">
        <div className="p-6 border-b">
          <Link href="/admin/dashboard" className="text-2xl font-bold text-primary tracking-tight">NexGenShop</Link>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin/dashboard">
            <Button variant="secondary" className="w-full justify-start gap-3 bg-primary/10 text-primary hover:bg-primary/20">
              <LayoutDashboard className="h-5 w-5" /> Dashboard
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-primary">
              <ShoppingBag className="h-5 w-5" /> Products
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-primary">
              <TrendingUp className="h-5 w-5" /> Orders
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-primary">
              <Users className="h-5 w-5" /> Customers
            </Button>
          </Link>
          <div className="pt-4 mt-4 border-t">
            <Link href="/admin/settings">
              <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-primary">
                <Settings className="h-5 w-5" /> Settings
              </Button>
            </Link>
          </div>
        </nav>
        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10">
            <LogOut className="h-5 w-5" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Topbar */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="relative w-96 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Global search..." className="pl-10 h-10 bg-muted/30 border-none shadow-none" />
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-accent rounded-full border-2 border-white"></span>
            </Button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">Alex Rivera</p>
                <p className="text-[10px] text-muted-foreground uppercase">Super Admin</p>
              </div>
              <Avatar className="h-10 w-10 border-2 border-primary/10">
                <AvatarImage src="https://picsum.photos/seed/admin/200/200" />
                <AvatarFallback>AR</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-primary">Welcome back, Alex</h1>
              <p className="text-muted-foreground">Here's what's happening with your store today.</p>
            </div>
            <Link href="/admin/products/new">
              <Button className="bg-primary text-white h-11 px-6 shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-5 w-5" /> Add New Product
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-2xl font-bold text-primary">{stat.value}</h3>
                    <div className={`flex items-center text-xs font-bold ${stat.isUp ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.isUp ? <ArrowUpRight className="h-4 w-4 mr-0.5" /> : <ArrowDownRight className="h-4 w-4 mr-0.5" />}
                      {stat.change}
                    </div>
                  </div>
                </CardContent>
                <div className={`h-1 w-full ${stat.isUp ? 'bg-green-500' : 'bg-red-500'} opacity-20`}></div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Orders Table */}
            <Card className="lg:col-span-2 border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-xl">Recent Orders</CardTitle>
                  <CardDescription>A list of the latest orders in your store.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-accent font-bold">View All</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors border">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-xs">
                          {order.customer.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-primary">{order.customer}</p>
                          <p className="text-xs text-muted-foreground">{order.id} • {order.date}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-6">
                        <div className="hidden sm:block">
                          <p className="text-sm font-bold text-primary">{order.amount}</p>
                        </div>
                        <Badge variant="secondary" className="capitalize bg-primary/5 text-primary border-none">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Products / Categories */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Inventory Alert</CardTitle>
                <CardDescription>Items running low on stock.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { name: 'Wireless Headphones', stock: 5, status: 'Critical' },
                  { name: 'Leather Sleeve', stock: 12, status: 'Low' },
                  { name: 'Ergonomic Chair', stock: 8, status: 'Low' },
                ].map((item) => (
                  <div key={item.name} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-primary">{item.name}</span>
                      <span className="text-xs font-bold text-muted-foreground">{item.stock} left</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.status === 'Critical' ? 'bg-destructive' : 'bg-yellow-500'}`} 
                        style={{ width: `${(item.stock / 50) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-4 text-primary font-bold">Manage Inventory</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
