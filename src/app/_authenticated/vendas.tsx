import { createFileRoute } from '@tanstack/react-router';
import { Vendas } from '@/src/pages/Vendas';

export const Route = createFileRoute('/_authenticated/vendas')({
  component: Vendas,
});