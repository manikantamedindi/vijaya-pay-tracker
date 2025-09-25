"use client"

import { StatementUpload } from "@/components/statement-upload"
import { PaymentMatching } from "@/components/payment-matching"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function PaymentReconciliation() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Payment Reconciliation</h2>
        <p className="text-muted-foreground">Upload bank statements and match payments with booth members</p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList>
          <TabsTrigger value="upload">Statement Upload</TabsTrigger>
          <TabsTrigger value="matching">Payment Matching</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <StatementUpload />
        </TabsContent>

        <TabsContent value="matching" className="mt-6">
          <PaymentMatching />
        </TabsContent>
      </Tabs>
    </div>
  )
}
