import { Order, OrderItem } from '../contexts/OrderContext';

export interface OrderAnalysis {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  mostPurchasedItems: Array<{ item: OrderItem; count: number; totalSpent: number }>;
  favoriteBrands: Array<{ brand: string; count: number; totalSpent: number }>;
  spendingByMonth: Array<{ month: string; total: number; orderCount: number }>;
  recentOrders: Order[];
  orderFrequency: string;
  topCategories: Array<{ category: string; count: number; totalSpent: number }>;
}

export class OrderAnalysisService {
  static analyzeOrders(orders: Order[]): OrderAnalysis {
    if (orders.length === 0) {
      return {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        mostPurchasedItems: [],
        favoriteBrands: [],
        spendingByMonth: [],
        recentOrders: [],
        orderFrequency: 'No orders yet',
        topCategories: []
      };
    }

    // Calculate basic metrics
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalSpent / totalOrders;

    // Analyze most purchased items
    const itemCounts = new Map<string, { item: OrderItem; count: number; totalSpent: number }>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const key = `${item.id}-${item.selectedSize || 'default'}`;
        const existing = itemCounts.get(key);
        if (existing) {
          existing.count += item.quantity;
          existing.totalSpent += item.price * item.quantity;
        } else {
          itemCounts.set(key, {
            item,
            count: item.quantity,
            totalSpent: item.price * item.quantity
          });
        }
      });
    });

    const mostPurchasedItems = Array.from(itemCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Analyze favorite brands
    const brandCounts = new Map<string, { brand: string; count: number; totalSpent: number }>();
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.brand) {
          const existing = brandCounts.get(item.brand);
          if (existing) {
            existing.count += item.quantity;
            existing.totalSpent += item.price * item.quantity;
          } else {
            brandCounts.set(item.brand, {
              brand: item.brand,
              count: item.quantity,
              totalSpent: item.price * item.quantity
            });
          }
        }
      });
    });

    const favoriteBrands = Array.from(brandCounts.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // Analyze spending by month
    const monthlySpending = new Map<string, { total: number; orderCount: number }>();
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlySpending.get(monthKey);
      if (existing) {
        existing.total += order.total;
        existing.orderCount += 1;
      } else {
        monthlySpending.set(monthKey, {
          total: order.total,
          orderCount: 1
        });
      }
    });

    const spendingByMonth = Array.from(monthlySpending.entries())
      .map(([month, data]) => ({
        month,
        ...data
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Get recent orders (last 5)
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Calculate order frequency
    const orderFrequency = this.calculateOrderFrequency(orders);

    // Analyze top categories (based on item names)
    const categoryCounts = new Map<string, { category: string; count: number; totalSpent: number }>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const category = this.categorizeItem(item.name);
        const existing = categoryCounts.get(category);
        if (existing) {
          existing.count += item.quantity;
          existing.totalSpent += item.price * item.quantity;
        } else {
          categoryCounts.set(category, {
            category,
            count: item.quantity,
            totalSpent: item.price * item.quantity
          });
        }
      });
    });

    const topCategories = Array.from(categoryCounts.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return {
      totalOrders,
      totalSpent,
      averageOrderValue,
      mostPurchasedItems,
      favoriteBrands,
      spendingByMonth,
      recentOrders,
      orderFrequency,
      topCategories
    };
  }

  private static calculateOrderFrequency(orders: Order[]): string {
    if (orders.length < 2) return 'New customer';
    
    const sortedOrders = orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const firstOrder = new Date(sortedOrders[0].createdAt);
    const lastOrder = new Date(sortedOrders[sortedOrders.length - 1].createdAt);
    const daysBetween = (lastOrder.getTime() - firstOrder.getTime()) / (1000 * 60 * 60 * 24);
    const averageDaysBetween = daysBetween / (orders.length - 1);

    if (averageDaysBetween <= 7) return 'Very frequent (weekly)';
    if (averageDaysBetween <= 30) return 'Frequent (monthly)';
    if (averageDaysBetween <= 90) return 'Occasional (quarterly)';
    return 'Infrequent';
  }

  private static categorizeItem(itemName: string): string {
    const name = itemName.toLowerCase();
    
    if (name.includes('makeup') || name.includes('cosmetic') || name.includes('beauty') || name.includes('eyeshadow') || name.includes('lipstick') || name.includes('foundation')) {
      return 'Beauty & Cosmetics';
    }
    if (name.includes('shirt') || name.includes('dress') || name.includes('pants') || name.includes('jeans') || name.includes('jacket') || name.includes('sweater')) {
      return 'Clothing';
    }
    if (name.includes('phone') || name.includes('laptop') || name.includes('computer') || name.includes('tablet') || name.includes('headphone')) {
      return 'Electronics';
    }
    if (name.includes('food') || name.includes('snack') || name.includes('drink') || name.includes('beverage')) {
      return 'Food & Beverages';
    }
    if (name.includes('toy') || name.includes('game') || name.includes('book')) {
      return 'Toys & Games';
    }
    if (name.includes('kitchen') || name.includes('cookware') || name.includes('utensil')) {
      return 'Home & Kitchen';
    }
    
    return 'Other';
  }

  static generateOrderInsights(analysis: OrderAnalysis): string {
    if (analysis.totalOrders === 0) {
      return "You haven't placed any orders yet. Start shopping to see your order insights!";
    }

    const insights = [];

    // Basic stats
    insights.push(`📊 **Order Summary:** You've placed ${analysis.totalOrders} orders with a total spending of $${analysis.totalSpent.toFixed(2)}.`);
    insights.push(`💰 **Average Order Value:** $${analysis.averageOrderValue.toFixed(2)} per order.`);
    insights.push(`📅 **Order Frequency:** ${analysis.orderFrequency}.`);

    // Most purchased items
    if (analysis.mostPurchasedItems.length > 0) {
      const topItem = analysis.mostPurchasedItems[0];
      insights.push(`🛍️ **Most Purchased:** ${topItem.item.name} (${topItem.count} times, $${topItem.totalSpent.toFixed(2)} total).`);
    }

    // Favorite brands
    if (analysis.favoriteBrands.length > 0) {
      const topBrand = analysis.favoriteBrands[0];
      insights.push(`🏷️ **Favorite Brand:** ${topBrand.brand} (${topBrand.count} items, $${topBrand.totalSpent.toFixed(2)} total).`);
    }

    // Top categories
    if (analysis.topCategories.length > 0) {
      const topCategory = analysis.topCategories[0];
      insights.push(`📦 **Top Category:** ${topCategory.category} (${topCategory.count} items, $${topCategory.totalSpent.toFixed(2)} total).`);
    }

    // Recent activity
    if (analysis.recentOrders.length > 0) {
      const lastOrder = analysis.recentOrders[0];
      const daysSinceLastOrder = Math.floor((Date.now() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      insights.push(`🕒 **Last Order:** ${daysSinceLastOrder} days ago (Order #${lastOrder.id}).`);
    }

    return insights.join('\n\n');
  }

  static answerOrderQuery(query: string, analysis: OrderAnalysis): string {
    const lowerQuery = query.toLowerCase();

    if (analysis.totalOrders === 0) {
      return "You haven't placed any orders yet. Start shopping to see your order history!";
    }

    // Total spending queries
    if (lowerQuery.includes('total spent') || lowerQuery.includes('how much') || lowerQuery.includes('spending')) {
      return `You've spent a total of $${analysis.totalSpent.toFixed(2)} across ${analysis.totalOrders} orders. Your average order value is $${analysis.averageOrderValue.toFixed(2)}.`;
    }

    // Order count queries
    if (lowerQuery.includes('how many orders') || lowerQuery.includes('order count') || lowerQuery.includes('number of orders')) {
      return `You've placed ${analysis.totalOrders} orders so far.`;
    }

    // Most purchased items
    if (lowerQuery.includes('most purchased') || lowerQuery.includes('favorite item') || lowerQuery.includes('bought most')) {
      if (analysis.mostPurchasedItems.length > 0) {
        const topItem = analysis.mostPurchasedItems[0];
        return `Your most purchased item is "${topItem.item.name}" - you've bought it ${topItem.count} times for a total of $${topItem.totalSpent.toFixed(2)}.`;
      }
      return "You haven't purchased any items multiple times yet.";
    }

    // Favorite brands
    if (lowerQuery.includes('favorite brand') || lowerQuery.includes('most bought brand')) {
      if (analysis.favoriteBrands.length > 0) {
        const topBrand = analysis.favoriteBrands[0];
        return `Your favorite brand is ${topBrand.brand} - you've bought ${topBrand.count} items from them for a total of $${topBrand.totalSpent.toFixed(2)}.`;
      }
      return "You haven't purchased enough items from the same brand to determine a favorite yet.";
    }

    // Recent orders
    if (lowerQuery.includes('recent') || lowerQuery.includes('last order') || lowerQuery.includes('latest')) {
      if (analysis.recentOrders.length > 0) {
        const lastOrder = analysis.recentOrders[0];
        const daysSince = Math.floor((Date.now() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return `Your most recent order was placed ${daysSince} days ago (Order #${lastOrder.id}) for $${lastOrder.total.toFixed(2)}.`;
      }
    }

    // Order frequency
    if (lowerQuery.includes('frequency') || lowerQuery.includes('how often') || lowerQuery.includes('order pattern')) {
      return `Your order frequency is: ${analysis.orderFrequency}.`;
    }

    // Top categories
    if (lowerQuery.includes('category') || lowerQuery.includes('type of items')) {
      if (analysis.topCategories.length > 0) {
        const topCategory = analysis.topCategories[0];
        return `You spend the most on ${topCategory.category} - $${topCategory.totalSpent.toFixed(2)} across ${topCategory.count} items.`;
      }
    }

    // Default response with general insights
    return this.generateOrderInsights(analysis);
  }
} 