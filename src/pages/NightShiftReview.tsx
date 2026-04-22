import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Eye, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import dutyService, { ReviewResponse } from '@/services/dutyService';

const ACTION_LABELS: Record<string, string> = {
  EVOLUTION_CREATED: 'Evolucao registrada',
  TRIAGE_PERFORMED: 'Triagem realizada',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'Pendente',
  REVIEWED: 'Revisado',
  CLEARED: 'Liberado',
};

export default function NightShiftReview() {
  const [actions, setActions] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState<{ action: ReviewResponse; type: 'review' | 'clear' } | null>(null);
  const [notes, setNotes] = useState('');

  const loadActions = async () => {
    try {
      setLoading(true);
      const data = await dutyService.getPendingReviews(0, 50);
      setActions(data.content);
    } catch (error) {
      toast.error('Erro ao carregar acoes pendentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActions();
  }, []);

  const handleReview = async () => {
    if (!reviewDialog) return;
    try {
      if (reviewDialog.type === 'review') {
        await dutyService.reviewAction(reviewDialog.action.id, { reviewNotes: notes || undefined });
        toast.success('Acao marcada como revisada');
      } else {
        await dutyService.clearAction(reviewDialog.action.id, { reviewNotes: notes || undefined });
        toast.success('Acao liberada');
      }
      setReviewDialog(null);
      setNotes('');
      loadActions();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao processar revisao');
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revisao de Plantao</h1>
        <p className="text-muted-foreground">Revise acoes realizadas durante plantoes noturnos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-indigo-500" />
            Acoes Pendentes de Revisao
          </CardTitle>
          <CardDescription>{actions.length} acao(oes) aguardando revisao</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Carregando...</p>
          ) : actions.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Nenhuma acao pendente de revisao</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Acao</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell className="font-medium">{action.actorStaffName || action.actorStaffId}</TableCell>
                    <TableCell>{ACTION_LABELS[action.actionType] || action.actionType}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{action.entityType}</span>
                    </TableCell>
                    <TableCell>{formatTime(action.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={action.reviewStatus === 'PENDING_REVIEW' ? 'destructive' : 'secondary'}>
                        {STATUS_LABELS[action.reviewStatus] || action.reviewStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setReviewDialog({ action, type: 'review' }); setNotes(''); }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Revisar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => { setReviewDialog({ action, type: 'clear' }); setNotes(''); }}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Liberar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!reviewDialog} onOpenChange={() => setReviewDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewDialog?.type === 'review' ? 'Revisar Acao' : 'Liberar Acao'}
            </DialogTitle>
            <DialogDescription>
              {reviewDialog?.action.actorStaffName} - {ACTION_LABELS[reviewDialog?.action.actionType || ''] || reviewDialog?.action.actionType}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Observacoes (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observacoes sobre a revisao..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(null)}>Cancelar</Button>
            <Button onClick={handleReview}>
              {reviewDialog?.type === 'review' ? 'Confirmar Revisao' : 'Confirmar Liberacao'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
