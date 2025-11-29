"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ComponentShowcaseProps {
  title: string;
  description: string;
}

export const ComponentShowcase = ({ title, description }: ComponentShowcaseProps) => {
  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">{title}</CardTitle>
          <CardDescription className="text-gray-400">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Button Examples */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="default">Default Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
          </div>

          {/* Badge Examples */}
          <div className="flex gap-2 flex-wrap">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Error</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>

          {/* Input Examples */}
          <div className="space-y-2">
            <Input placeholder="Enter amount..." className="bg-gray-700 border-gray-600" />
          </div>

          {/* Tabs Example */}
          <Tabs defaultValue="tab1" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
              <TabsTrigger value="tab3">Tab 3</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="text-gray-300">
              Content for tab 1
            </TabsContent>
            <TabsContent value="tab2" className="text-gray-300">
              Content for tab 2
            </TabsContent>
            <TabsContent value="tab3" className="text-gray-300">
              Content for tab 3
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
