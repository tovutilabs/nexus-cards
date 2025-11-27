'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { CardComponentRenderer } from '@/components/card-components/CardComponentRenderer';
import { CardComponent } from '@/components/card-components/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CardComponentListProps {
  components: CardComponent[];
  cardData: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    jobTitle: string | null;
    avatarUrl: string | null;
  };
  isEditable?: boolean;
  onReorder?: (componentOrders: Array<{ id: string; order: number }>) => void;
  onEdit?: (component: CardComponent) => void;
  onDelete?: (componentId: string) => void;
  onToggleEnabled?: (componentId: string, enabled: boolean) => void;
}

export function CardComponentList({
  components,
  cardData,
  isEditable = false,
  onReorder,
  onEdit,
  onDelete,
  onToggleEnabled,
}: CardComponentListProps) {
  const sortedComponents = [...components].sort((a, b) => a.order - b.order);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorder) return;

    const items = Array.from(sortedComponents);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Call the onReorder callback with new orders
    const updatedOrders = items.map((item, index) => ({
      id: item.id,
      order: index,
    }));
    onReorder(updatedOrders);
  };

  if (!isEditable) {
    // View mode - just render components without drag handles
    return (
      <div className="space-y-6">
        {sortedComponents
          .filter((c) => c.enabled)
          .map((component) => (
            <div key={component.id}>
              <CardComponentRenderer
                component={component}
                cardData={cardData}
              />
            </div>
          ))}
      </div>
    );
  }

  // Edit mode - render with drag-and-drop and controls
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="card-components">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={cn(
              'space-y-4',
              snapshot.isDraggingOver && 'bg-muted/50 rounded-lg p-2'
            )}
          >
            {sortedComponents.map((component, index) => (
              <Draggable key={component.id} draggableId={component.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={cn(
                      'relative group border rounded-lg overflow-hidden transition-shadow',
                      snapshot.isDragging && 'shadow-lg ring-2 ring-primary',
                      !component.enabled && 'opacity-50'
                    )}
                  >
                    {/* Drag handle and controls */}
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-md p-1 shadow-sm">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-grab active:cursor-grabbing"
                        {...provided.dragHandleProps}
                      >
                        <GripVertical className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onToggleEnabled?.(component.id, !component.enabled)}
                      >
                        {component.enabled ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit?.(component)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete?.(component.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Component content */}
                    <div className="pointer-events-none">
                      <CardComponentRenderer
                        component={component}
                        cardData={cardData}
                      />
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
