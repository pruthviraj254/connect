'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  label: string;
  hint?: string;
  urls: string[];
  max?: number;
  placeholder?: string;
  onChange: (urls: string[]) => void;
};

export function UrlListField({ label, hint, urls, max = 8, placeholder, onChange }: Props) {
  const list = urls.length ? urls : [''];

  const updateAt = (index: number, value: string) => {
    const next = [...list];
    next[index] = value;
    onChange(next.filter((u, i) => u.trim() || i < next.length - 1 || next.length === 1));
  };

  const add = () => {
    if (list.length >= max) return;
    onChange([...list, '']);
  };

  const remove = (index: number) => {
    onChange(list.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {list.map((url, i) => (
        <div key={i} className="flex gap-2">
          <Input
            placeholder={placeholder ?? 'https://…'}
            value={url}
            onChange={(e) => updateAt(i, e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-destructive"
            disabled={list.length <= 1 && !url}
            onClick={() => remove(i)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {list.length < max && (
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4 mr-1" />
          Add image URL
        </Button>
      )}
    </div>
  );
}
