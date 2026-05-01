import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { desktopBridge } from '@/lib/desktopBridge';
import { toast } from 'sonner';

interface Props {
  /** HTML completo da prescrição (será envelopado com <html><body>...). */
  html: string;
  title?: string;
  /** Texto custom para o botão. */
  label?: string;
  className?: string;
}

/**
 * Em desktop chama o sidecar (`print_html`) que abre janela secundária com `window.print()`.
 * Em browser puro, fallback: abre nova janela e dispara print.
 */
export function PrescriptionPrintButton({ html, title, label, className }: Props) {
  async function handleClick() {
    if (desktopBridge.isAvailable()) {
      try {
        await desktopBridge.invoke('print_html', { request: { html, title } });
      } catch (e) {
        console.error('print_html failed', e);
        toast.error('Falha ao abrir janela de impressão.');
      }
      return;
    }

    // Fallback browser
    const w = window.open('', '_blank', 'width=800,height=1000');
    if (!w) {
      toast.error('Não foi possível abrir a janela de impressão (popup bloqueado).');
      return;
    }
    w.document.write(`<!doctype html><html><head><title>${title ?? 'AmazHealth'}</title></head><body>${html}<script>setTimeout(()=>window.print(),100);</script></body></html>`);
    w.document.close();
  }

  return (
    <Button onClick={handleClick} variant="outline" size="sm" className={className}>
      <Printer className="mr-2 h-4 w-4" />
      {label ?? 'Imprimir'}
    </Button>
  );
}
