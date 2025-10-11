import React from 'react';
import { useForm, UseFormReturn, SubmitHandler, DefaultValues } from 'react-hook-form';
import type { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';

interface ProfileFormProps<Schema extends z.ZodType<Record<string, any>, any, any>> {
    schema: Schema;
    defaultValues: DefaultValues<z.input<Schema>>;
    onSubmit: SubmitHandler<z.output<Schema>>;
    children: (form: UseFormReturn<z.input<Schema>, any, z.output<Schema>>) => React.ReactNode;
    isSubmitting: boolean;
    hasUnsavedChanges: boolean;
    setHasUnsavedChanges: (value: boolean) => void;
}

export function ProfileForm<Schema extends z.ZodType<Record<string, any>, any, any>>({
    schema,
    defaultValues,
    onSubmit,
    children,
    isSubmitting,
    hasUnsavedChanges,
    setHasUnsavedChanges,
}: ProfileFormProps<Schema>) {
    const form = useForm<z.input<Schema>, any, z.output<Schema>>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    React.useEffect(() => {
        const subscription = form.watch(() => {
            setHasUnsavedChanges(form.formState.isDirty);
        });
        return () => subscription.unsubscribe();
    }, [form, setHasUnsavedChanges]);

    React.useEffect(() => {
        form.reset(defaultValues);
    }, [defaultValues, form]);

    const handleValidSubmit: SubmitHandler<z.output<Schema>> = async (data) => {
        await onSubmit(data);
        form.reset(data);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleValidSubmit)} className="space-y-6">
                {children(form)}
                <div className="flex justify-end gap-4">
                    <Button
                        type="submit"
                        disabled={isSubmitting || !hasUnsavedChanges}
                        className="flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
