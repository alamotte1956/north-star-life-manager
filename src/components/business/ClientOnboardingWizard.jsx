import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, ArrowRight, ArrowLeft, Mail, CheckCircle, Building2, User, DollarSign, MessageSquare, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ClientOnboardingWizard({ open, onOpenChange, onComplete }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [formData, setFormData] = useState({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        industry: '',
        company_description: '',
        billing_rate: '',
        payment_terms: 'Net 30',
        notes: '',
        communication_preferences: {
            preferred_method: 'email',
            frequency: 'weekly',
            send_updates: true,
            send_invoices: true,
            send_reminders: true
        },
        selected_services: []
    });

    const totalSteps = 5;

    const handleNext = async () => {
        if (step === 2 && !aiSuggestions) {
            // Get AI analysis after step 2
            setLoading(true);
            try {
                const response = await base44.functions.invoke('analyzeNewClient', {
                    company_name: formData.company_name,
                    industry: formData.industry,
                    company_description: formData.company_description,
                    contact_name: formData.contact_name
                });
                setAiSuggestions(response.data);
                setFormData(prev => ({
                    ...prev,
                    ...response.data.suggested_data
                }));
            } catch (error) {
                toast.error('Failed to get AI suggestions');
            } finally {
                setLoading(false);
            }
        }
        setStep(step + 1);
    };

    const handleBack = () => setStep(step - 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Create client with communication preferences
            const client = await base44.entities.BusinessClient.create({
                company_name: formData.company_name,
                contact_name: formData.contact_name,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                industry: formData.industry,
                billing_rate: parseFloat(formData.billing_rate) || 0,
                payment_terms: formData.payment_terms,
                notes: `${formData.notes}\n\nCommunication Preferences:\n- Method: ${formData.communication_preferences.preferred_method}\n- Frequency: ${formData.communication_preferences.frequency}\n- Updates: ${formData.communication_preferences.send_updates ? 'Yes' : 'No'}\n- Invoices: ${formData.communication_preferences.send_invoices ? 'Yes' : 'No'}\n- Reminders: ${formData.communication_preferences.send_reminders ? 'Yes' : 'No'}\n\nSelected Services: ${formData.selected_services.join(', ') || 'None yet'}`,
                tags: aiSuggestions?.tags || []
            });

            // Send welcome email
            if (aiSuggestions?.welcome_email) {
                await base44.integrations.Core.SendEmail({
                    to: formData.email,
                    subject: aiSuggestions.welcome_email.subject,
                    body: aiSuggestions.welcome_email.body
                });
            }

            toast.success('Client onboarded successfully! Welcome email sent.');
            onComplete(client);
            onOpenChange(false);
            
            // Reset
            setStep(1);
            setAiSuggestions(null);
            setFormData({
                company_name: '',
                contact_name: '',
                email: '',
                phone: '',
                address: '',
                industry: '',
                company_description: '',
                billing_rate: '',
                payment_terms: 'Net 30',
                notes: '',
                communication_preferences: {
                    preferred_method: 'email',
                    frequency: 'weekly',
                    send_updates: true,
                    send_invoices: true,
                    send_reminders: true
                },
                selected_services: []
            });
        } catch (error) {
            toast.error('Failed to create client');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#4A90E2] to-[#2E5C8A] rounded-full mb-4">
                                <Building2 className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-light text-black mb-2">Company Information</h3>
                            <p className="text-sm text-gray-600">Let's start with the basics about your new client</p>
                        </div>

                        <div>
                            <Label>Company Name *</Label>
                            <Input
                                value={formData.company_name}
                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                placeholder="Acme Corporation"
                                required
                            />
                        </div>

                        <div>
                            <Label>Industry *</Label>
                            <Input
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                placeholder="e.g., Technology, Healthcare, Retail"
                                required
                            />
                        </div>

                        <div>
                            <Label>Company Description</Label>
                            <Textarea
                                value={formData.company_description}
                                onChange={(e) => setFormData({ ...formData, company_description: e.target.value })}
                                placeholder="Brief description of what the company does..."
                                rows={3}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                <Sparkles className="w-3 h-3 inline mr-1" />
                                This helps our AI suggest the best services for them
                            </p>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#4A90E2] to-[#2E5C8A] rounded-full mb-4">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-light text-black mb-2">Contact Details</h3>
                            <p className="text-sm text-gray-600">Who will be your main point of contact?</p>
                        </div>

                        <div>
                            <Label>Primary Contact Name *</Label>
                            <Input
                                value={formData.contact_name}
                                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                placeholder="John Smith"
                                required
                            />
                        </div>

                        <div>
                            <Label>Email *</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@acmecorp.com"
                                required
                            />
                        </div>

                        <div>
                            <Label>Phone</Label>
                            <Input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="(555) 123-4567"
                            />
                        </div>

                        <div>
                            <Label>Address</Label>
                            <Input
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="123 Main St, City, State 12345"
                            />
                        </div>
                    </div>
                );

            case 3:
                if (loading) {
                    return (
                        <div className="py-12 text-center">
                            <Sparkles className="w-12 h-12 text-[#4A90E2] mx-auto mb-4 animate-pulse" />
                            <h3 className="text-lg font-light text-black mb-2">AI is analyzing...</h3>
                            <p className="text-sm text-gray-600">Creating personalized recommendations</p>
                        </div>
                    );
                }

                return (
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#4A90E2] to-[#2E5C8A] rounded-full mb-4">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-light text-black mb-2">AI Recommendations</h3>
                            <p className="text-sm text-gray-600">Based on your client's profile</p>
                        </div>

                        {aiSuggestions && (
                            <>
                                <Card className="p-4 border-[#4A90E2]/20 bg-blue-50">
                                    <h4 className="font-medium text-black mb-2 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-[#4A90E2]" />
                                        Client Category
                                    </h4>
                                    <Badge className="bg-[#4A90E2] text-white">{aiSuggestions.category}</Badge>
                                    <p className="text-sm text-gray-700 mt-2">{aiSuggestions.category_reasoning}</p>
                                </Card>

                                <Card className="p-4 border-[#4A90E2]/20">
                                    <h4 className="font-medium text-black mb-3">Suggested Services</h4>
                                    <div className="space-y-2">
                                        {aiSuggestions.suggested_services?.map((service, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-sm">
                                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <div className="font-medium text-black">{service.name}</div>
                                                    <div className="text-gray-600">{service.description}</div>
                                                    {service.estimated_value && (
                                                        <div className="text-[#4A90E2] text-xs mt-1">
                                                            Est. ${service.estimated_value}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                <Card className="p-4 border-[#4A90E2]/20">
                                    <h4 className="font-medium text-black mb-2">Tags</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {aiSuggestions.tags?.map((tag, idx) => (
                                            <Badge key={idx} variant="outline">{tag}</Badge>
                                        ))}
                                    </div>
                                </Card>
                            </>
                        )}
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#4A90E2] to-[#2E5C8A] rounded-full mb-4">
                                <MessageSquare className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-light text-black mb-2">Communication Preferences</h3>
                            <p className="text-sm text-gray-600">How would you like to stay in touch?</p>
                        </div>

                        <Card className="p-4 border-[#4A90E2]/20 bg-blue-50">
                            <p className="text-sm text-gray-700">
                                Set up communication preferences to ensure you and your client stay aligned on project updates, 
                                invoices, and important milestones.
                            </p>
                        </Card>

                        <div>
                            <Label>Preferred Contact Method</Label>
                            <Select
                                value={formData.communication_preferences.preferred_method}
                                onValueChange={(value) => setFormData({
                                    ...formData,
                                    communication_preferences: {
                                        ...formData.communication_preferences,
                                        preferred_method: value
                                    }
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="phone">Phone</SelectItem>
                                    <SelectItem value="video">Video Call</SelectItem>
                                    <SelectItem value="in_person">In Person</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Update Frequency</Label>
                            <Select
                                value={formData.communication_preferences.frequency}
                                onValueChange={(value) => setFormData({
                                    ...formData,
                                    communication_preferences: {
                                        ...formData.communication_preferences,
                                        frequency: value
                                    }
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="as_needed">As Needed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3 pt-2">
                            <Label className="flex items-center gap-2">
                                <Bell className="w-4 h-4 text-[#4A90E2]" />
                                Notification Settings
                            </Label>
                            
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="send_updates"
                                        checked={formData.communication_preferences.send_updates}
                                        onCheckedChange={(checked) => setFormData({
                                            ...formData,
                                            communication_preferences: {
                                                ...formData.communication_preferences,
                                                send_updates: checked
                                            }
                                        })}
                                    />
                                    <Label htmlFor="send_updates" className="text-sm font-normal cursor-pointer">
                                        Send project updates and progress reports
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="send_invoices"
                                        checked={formData.communication_preferences.send_invoices}
                                        onCheckedChange={(checked) => setFormData({
                                            ...formData,
                                            communication_preferences: {
                                                ...formData.communication_preferences,
                                                send_invoices: checked
                                            }
                                        })}
                                    />
                                    <Label htmlFor="send_invoices" className="text-sm font-normal cursor-pointer">
                                        Send invoice notifications
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="send_reminders"
                                        checked={formData.communication_preferences.send_reminders}
                                        onCheckedChange={(checked) => setFormData({
                                            ...formData,
                                            communication_preferences: {
                                                ...formData.communication_preferences,
                                                send_reminders: checked
                                            }
                                        })}
                                    />
                                    <Label htmlFor="send_reminders" className="text-sm font-normal cursor-pointer">
                                        Send payment reminders
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#4A90E2] to-[#2E5C8A] rounded-full mb-4">
                                <DollarSign className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-light text-black mb-2">Services & Financial Terms</h3>
                            <p className="text-sm text-gray-600">Select services and set billing</p>
                        </div>

                        {aiSuggestions?.suggested_services && (
                            <div className="mb-4">
                                <Label className="mb-3 block">Recommended Services (select to include)</Label>
                                <div className="space-y-2">
                                    {aiSuggestions.suggested_services.map((service, idx) => (
                                        <Card
                                            key={idx}
                                            className={`p-3 cursor-pointer transition-all ${
                                                formData.selected_services.includes(service.name)
                                                    ? 'border-[#4A90E2] border-2 bg-blue-50'
                                                    : 'border-gray-200 hover:border-[#4A90E2]'
                                            }`}
                                            onClick={() => {
                                                const services = formData.selected_services.includes(service.name)
                                                    ? formData.selected_services.filter(s => s !== service.name)
                                                    : [...formData.selected_services, service.name];
                                                setFormData({ ...formData, selected_services: services });
                                            }}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="font-medium text-black flex items-center gap-2">
                                                        {formData.selected_services.includes(service.name) && (
                                                            <CheckCircle className="w-4 h-4 text-[#4A90E2]" />
                                                        )}
                                                        {service.name}
                                                    </div>
                                                    <div className="text-sm text-gray-600 mt-1">{service.description}</div>
                                                </div>
                                                {service.estimated_value && (
                                                    <Badge variant="outline" className="ml-2">
                                                        ${service.estimated_value}
                                                    </Badge>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <Label>Default Billing Rate (per hour)</Label>
                            <Input
                                type="number"
                                value={formData.billing_rate}
                                onChange={(e) => setFormData({ ...formData, billing_rate: e.target.value })}
                                placeholder="150"
                            />
                        </div>

                        <div>
                            <Label>Payment Terms</Label>
                            <Input
                                value={formData.payment_terms}
                                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                                placeholder="Net 30"
                            />
                        </div>

                        <div>
                            <Label>Additional Notes</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Any other important information..."
                                rows={3}
                            />
                        </div>

                        {aiSuggestions?.welcome_email && (
                            <Card className="p-4 border-green-200 bg-green-50">
                                <h4 className="font-medium text-black mb-2 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-green-600" />
                                    Welcome Email Preview
                                </h4>
                                <div className="text-sm space-y-1">
                                    <div><strong>To:</strong> {formData.email}</div>
                                    <div><strong>Subject:</strong> {aiSuggestions.welcome_email.subject}</div>
                                    <div className="pt-2 text-gray-700 whitespace-pre-wrap text-xs">
                                        {aiSuggestions.welcome_email.body.substring(0, 200)}...
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    const isStepValid = () => {
        switch (step) {
            case 1:
                return formData.company_name && formData.industry;
            case 2:
                return formData.contact_name && formData.email;
            case 3:
                return true;
            case 4:
                return true;
            case 5:
                return true;
            default:
                return false;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#4A90E2]" />
                        AI-Powered Client Onboarding
                    </DialogTitle>
                </DialogHeader>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Step {step} of {totalSteps}</span>
                        <span className="text-sm text-gray-600">{Math.round((step / totalSteps) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#4A90E2] to-[#2E5C8A] transition-all duration-300"
                            style={{ width: `${(step / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>

                {renderStep()}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={step === 1 || loading}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    {step < totalSteps ? (
                        <Button
                            onClick={handleNext}
                            disabled={!isStepValid() || loading}
                            className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                        >
                            {loading ? 'Analyzing...' : 'Next'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                        >
                            {loading ? 'Creating...' : 'Complete Onboarding'}
                            <CheckCircle className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}