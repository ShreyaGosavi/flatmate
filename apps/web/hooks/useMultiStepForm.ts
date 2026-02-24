"use client";

import { useState } from "react";

type UseMultiStepFormOptions<T> = {
    steps: unknown[]; // your step config array
    onSubmit: (data: T) => Promise<void> | void;
};

export function useMultiStepForm<T extends Record<string, any>>(
    options: UseMultiStepFormOptions<T>
) {
    const { steps, onSubmit } = options;

    // current step index
    const [currentStep, setCurrentStep] = useState(0);

    // accumulated form data
    const [formData, setFormData] = useState<Partial<T>>({});

    // ui states
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // derived flags
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;

    // progress percentage (nice for progress bars)
    const progress = ((currentStep + 1) / steps.length) * 100;

    // -----------------------------
    // navigation
    // -----------------------------

    const goToNextStep = () => {
        if (!isLastStep) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const goToPreviousStep = () => {
        if (!isFirstStep) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const goToStep = (stepIndex: number) => {
        if (stepIndex >= 0 && stepIndex < steps.length) {
            setCurrentStep(stepIndex);
        }
    };

    // -----------------------------
    // data handling
    // -----------------------------

    const updateFormData = (newData: Partial<T>) => {
        setFormData((prev) => ({
            ...prev,
            ...newData,
        }));
    };

    const setEmailVerified = (email: string) => {
        setFormData((prev) => ({
            ...prev,
            email,
            isEmailVerified: true,
        }));
    };

    // -----------------------------
    // submission
    // -----------------------------

    const submitForm = async () => {
        setIsLoading(true);
        try {
            await onSubmit(formData as T);
            setIsSubmitted(true);
        } catch (err) {
            console.error("Submission error:", err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // -----------------------------
    // reset
    // -----------------------------

    const resetForm = () => {
        setFormData({});
        setCurrentStep(0);
        setIsSubmitted(false);
        setIsLoading(false);
    };

    return {
        // state
        currentStep,
        formData,
        isFirstStep,
        isLastStep,
        isSubmitted,
        isLoading,
        progress,
        steps,

        // navigation
        goToNextStep,
        goToPreviousStep,
        goToStep,

        // data
        updateFormData,
        setEmailVerified,

        // submission
        submitForm,

        // reset
        resetForm,
    };
}