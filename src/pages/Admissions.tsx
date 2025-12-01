import { useState } from 'react';
import { Plus } from 'lucide-react';

import { AdmissionForm } from '@/components/admissions/AdmissionForm';
import { AdmissionList } from '@/components/admissions/AdmissionList';
import { BedBoardMap } from '@/components/admissions/BedBoardMap';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Admissions() {
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Internação</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe internações, aloque leitos e mantenha o mapa hospitalar atualizado.
          </p>
        </div>
        <Button onClick={() => setShowAdmissionForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Internação
        </Button>
      </div>

      <Tabs defaultValue="admissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="admissions">Internações</TabsTrigger>
          <TabsTrigger value="mapa">Mapa de Leitos</TabsTrigger>
        </TabsList>

        <TabsContent value="admissions">
          <AdmissionList />
        </TabsContent>

        <TabsContent value="mapa">
          <BedBoardMap />
        </TabsContent>
      </Tabs>

      <AdmissionForm open={showAdmissionForm} onOpenChange={setShowAdmissionForm} />
    </div>
  );
}
