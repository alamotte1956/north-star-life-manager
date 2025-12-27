import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ShareDialog from './ShareDialog';

export default function ShareButton({ entityType, entityId, entityName, variant = "outline", size = "sm", className = "" }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={() => setOpen(true)}
                className={`gap-2 ${className}`}
            >
                <Share2 className="w-4 h-4" />
                Share
            </Button>
            
            <ShareDialog
                open={open}
                onOpenChange={setOpen}
                entityType={entityType}
                entityId={entityId}
                entityName={entityName}
            />
        </>
    );
}