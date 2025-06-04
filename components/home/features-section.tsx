import { Card, CardContent } from "@/components/ui/card"
import { Truck, Shield, Headphones, CreditCard, RotateCcw, Award } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: Truck,
      title: "Free Shipping",
      description: "Free shipping on orders over $50. Fast and reliable delivery worldwide.",
    },
    {
      icon: Shield,
      title: "Secure Payment",
      description: "Your payment information is encrypted and secure with SSL protection.",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Round-the-clock customer support to help you with any questions.",
    },
    {
      icon: CreditCard,
      title: "Easy Payments",
      description: "Multiple payment options including credit cards, PayPal, and more.",
    },
    {
      icon: RotateCcw,
      title: "Easy Returns",
      description: "30-day return policy. No questions asked, hassle-free returns.",
    },
    {
      icon: Award,
      title: "Quality Guarantee",
      description: "All products are quality tested and come with manufacturer warranty.",
    },
  ]

  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why Choose ShopHub?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're committed to providing you with the best shopping experience possible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
