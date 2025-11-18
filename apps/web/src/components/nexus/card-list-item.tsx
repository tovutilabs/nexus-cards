import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Share2, Trash2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CardListItemProps {
  id: string;
  title: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isDefault?: boolean;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onShare?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const statusConfig = {
  DRAFT: {
    label: 'Draft',
    variant: 'secondary' as const,
  },
  PUBLISHED: {
    label: 'Published',
    variant: 'default' as const,
  },
  ARCHIVED: {
    label: 'Archived',
    variant: 'outline' as const,
  },
};

export function CardListItem({
  id,
  title,
  status,
  isDefault,
  onView,
  onEdit,
  onShare,
  onDelete,
  className,
}: CardListItemProps) {
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold truncate">{title}</h3>
              {isDefault && (
                <Badge variant="outline" className="text-xs">
                  Default
                </Badge>
              )}
            </div>
            <div className="mt-2">
              <Badge variant={statusConfig[status].variant}>
                {statusConfig[status].label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {onView && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onView(id)}
                aria-label="View card"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="More options">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onShare && (
                  <DropdownMenuItem onClick={() => onShare(id)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
