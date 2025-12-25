import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { User, TrendingUp, Target, Home, Shield, Save, Plus, Trash2, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function FinancialProfile() {
    const queryClient = useQueryClient();
    const [profile, setProfile] = useState({
        age: '',
        date_of_birth: '',
        dependents: 0,
        dependents_details: [],
        marital_status: '',
        employment_status: '',
        annual_income: '',
        risk_tolerance: 'moderate',
        investment_horizon: 'medium-term',
        investment_experience: 'beginner',
        retirement_age_target: '',
        primary_financial_goals: [],
        home_ownership: '',
        wants_to_buy_home: false,
        home_purchase_timeline: 'no_plans',
        emergency_fund_months: '',
        has_life_insurance: false,
        has_health_insurance: false,
        has_disability_insurance: false,
        tax_filing_status: '',
        expected_major_expenses: [],
        current_debt_load: 'none',
        financial_advisor_preference: 'ai_only'
    });
    const [newGoal, setNewGoal] = useState('');
    const [newDependent, setNewDependent] = useState({ name: '', age: '', relationship: '' });
    const [newExpense, setNewExpense] = useState({ description: '', amount: '', timeline: '' });

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    useEffect(() => {
        if (user) {
            setProfile(prev => ({
                ...prev,
                age: user.age || '',
                date_of_birth: user.date_of_birth || '',
                dependents: user.dependents || 0,
                dependents_details: user.dependents_details || [],
                marital_status: user.marital_status || '',
                employment_status: user.employment_status || '',
                annual_income: user.annual_income || '',
                risk_tolerance: user.risk_tolerance || 'moderate',
                investment_horizon: user.investment_horizon || 'medium-term',
                investment_experience: user.investment_experience || 'beginner',
                retirement_age_target: user.retirement_age_target || '',
                primary_financial_goals: user.primary_financial_goals || [],
                home_ownership: user.home_ownership || '',
                wants_to_buy_home: user.wants_to_buy_home || false,
                home_purchase_timeline: user.home_purchase_timeline || 'no_plans',
                emergency_fund_months: user.emergency_fund_months || '',
                has_life_insurance: user.has_life_insurance || false,
                has_health_insurance: user.has_health_insurance || false,
                has_disability_insurance: user.has_disability_insurance || false,
                tax_filing_status: user.tax_filing_status || '',
                expected_major_expenses: user.expected_major_expenses || [],
                current_debt_load: user.current_debt_load || 'none',
                financial_advisor_preference: user.financial_advisor_preference || 'ai_only'
            }));
        }
    }, [user]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            return base44.auth.updateMe({
                ...profile,
                financial_profile_completed: true
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
            toast.success('Financial profile saved successfully!');
        }
    });

    const addGoal = () => {
        if (newGoal.trim()) {
            setProfile(prev => ({
                ...prev,
                primary_financial_goals: [...prev.primary_financial_goals, newGoal.trim()]
            }));
            setNewGoal('');
        }
    };

    const removeGoal = (index) => {
        setProfile(prev => ({
            ...prev,
            primary_financial_goals: prev.primary_financial_goals.filter((_, i) => i !== index)
        }));
    };

    const addDependent = () => {
        if (newDependent.name && newDependent.age) {
            setProfile(prev => ({
                ...prev,
                dependents_details: [...prev.dependents_details, { ...newDependent, age: parseInt(newDependent.age) }],
                dependents: prev.dependents_details.length + 1
            }));
            setNewDependent({ name: '', age: '', relationship: '' });
        }
    };

    const removeDependent = (index) => {
        setProfile(prev => ({
            ...prev,
            dependents_details: prev.dependents_details.filter((_, i) => i !== index),
            dependents: prev.dependents_details.length - 1
        }));
    };

    const addExpense = () => {
        if (newExpense.description && newExpense.amount) {
            setProfile(prev => ({
                ...prev,
                expected_major_expenses: [...prev.expected_major_expenses, { ...newExpense, amount: parseFloat(newExpense.amount) }]
            }));
            setNewExpense({ description: '', amount: '', timeline: '' });
        }
    };

    const removeExpense = (index) => {
        setProfile(prev => ({
            ...prev,
            expected_major_expenses: prev.expected_major_expenses.filter((_, i) => i !== index)
        }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#4A90E2]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] p-4 rounded-2xl">
                                <User className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-[#0F172A] mb-1">
                                Financial Profile
                            </h1>
                            <p className="text-[#64748B] font-light">
                                Complete your profile for personalized financial advice and investment recommendations
                            </p>
                        </div>
                    </div>
                    {!user?.financial_profile_completed && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                            Complete your profile to unlock personalized AI financial advice
                        </Badge>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Personal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-light flex items-center gap-2">
                                <User className="w-5 h-5 text-[#4A90E2]" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Age</Label>
                                    <Input
                                        type="number"
                                        value={profile.age}
                                        onChange={(e) => setProfile({...profile, age: parseInt(e.target.value)})}
                                        placeholder="35"
                                    />
                                </div>
                                <div>
                                    <Label>Date of Birth</Label>
                                    <Input
                                        type="date"
                                        value={profile.date_of_birth}
                                        onChange={(e) => setProfile({...profile, date_of_birth: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Marital Status</Label>
                                    <Select value={profile.marital_status} onValueChange={(val) => setProfile({...profile, marital_status: val})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single">Single</SelectItem>
                                            <SelectItem value="married">Married</SelectItem>
                                            <SelectItem value="divorced">Divorced</SelectItem>
                                            <SelectItem value="widowed">Widowed</SelectItem>
                                            <SelectItem value="partnered">Partnered</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Employment Status</Label>
                                    <Select value={profile.employment_status} onValueChange={(val) => setProfile({...profile, employment_status: val})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="employed">Employed</SelectItem>
                                            <SelectItem value="self_employed">Self-Employed</SelectItem>
                                            <SelectItem value="retired">Retired</SelectItem>
                                            <SelectItem value="unemployed">Unemployed</SelectItem>
                                            <SelectItem value="student">Student</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label>Annual Income</Label>
                                <Input
                                    type="number"
                                    value={profile.annual_income}
                                    onChange={(e) => setProfile({...profile, annual_income: parseFloat(e.target.value)})}
                                    placeholder="75000"
                                />
                            </div>
                            <div>
                                <Label>Tax Filing Status</Label>
                                <Select value={profile.tax_filing_status} onValueChange={(val) => setProfile({...profile, tax_filing_status: val})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single">Single</SelectItem>
                                        <SelectItem value="married_joint">Married Filing Jointly</SelectItem>
                                        <SelectItem value="married_separate">Married Filing Separately</SelectItem>
                                        <SelectItem value="head_of_household">Head of Household</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dependents */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-light">Dependents</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {profile.dependents_details.map((dep, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{dep.name}</p>
                                        <p className="text-sm text-gray-600">{dep.age} years old • {dep.relationship}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => removeDependent(idx)}>
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                </div>
                            ))}
                            <div className="grid grid-cols-4 gap-2">
                                <Input
                                    placeholder="Name"
                                    value={newDependent.name}
                                    onChange={(e) => setNewDependent({...newDependent, name: e.target.value})}
                                />
                                <Input
                                    type="number"
                                    placeholder="Age"
                                    value={newDependent.age}
                                    onChange={(e) => setNewDependent({...newDependent, age: e.target.value})}
                                />
                                <Input
                                    placeholder="Relationship"
                                    value={newDependent.relationship}
                                    onChange={(e) => setNewDependent({...newDependent, relationship: e.target.value})}
                                />
                                <Button onClick={addDependent} variant="outline">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Investment Profile */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-light flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-[#4A90E2]" />
                                Investment Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Risk Tolerance</Label>
                                    <Select value={profile.risk_tolerance} onValueChange={(val) => setProfile({...profile, risk_tolerance: val})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="conservative">Conservative - Prefer stability</SelectItem>
                                            <SelectItem value="moderate">Moderate - Balanced approach</SelectItem>
                                            <SelectItem value="aggressive">Aggressive - Higher risk for growth</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Investment Horizon</Label>
                                    <Select value={profile.investment_horizon} onValueChange={(val) => setProfile({...profile, investment_horizon: val})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="short-term">Short-term (&lt;3 years)</SelectItem>
                                            <SelectItem value="medium-term">Medium-term (3-10 years)</SelectItem>
                                            <SelectItem value="long-term">Long-term (10+ years)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Investment Experience</Label>
                                    <Select value={profile.investment_experience} onValueChange={(val) => setProfile({...profile, investment_experience: val})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="beginner">Beginner</SelectItem>
                                            <SelectItem value="intermediate">Intermediate</SelectItem>
                                            <SelectItem value="advanced">Advanced</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Target Retirement Age</Label>
                                    <Input
                                        type="number"
                                        value={profile.retirement_age_target}
                                        onChange={(e) => setProfile({...profile, retirement_age_target: parseInt(e.target.value)})}
                                        placeholder="65"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Goals */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-light flex items-center gap-2">
                                <Target className="w-5 h-5 text-[#4A90E2]" />
                                Primary Financial Goals
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {profile.primary_financial_goals.map((goal, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <span>{goal}</span>
                                    <Button variant="ghost" size="sm" onClick={() => removeGoal(idx)}>
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g., Retirement, Buy a house, College fund"
                                    value={newGoal}
                                    onChange={(e) => setNewGoal(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                                />
                                <Button onClick={addGoal} variant="outline">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Home & Real Estate */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-light flex items-center gap-2">
                                <Home className="w-5 h-5 text-[#4A90E2]" />
                                Home & Real Estate
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Home Ownership Status</Label>
                                    <Select value={profile.home_ownership} onValueChange={(val) => setProfile({...profile, home_ownership: val})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="own">Own</SelectItem>
                                            <SelectItem value="rent">Rent</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Home Purchase Timeline</Label>
                                    <Select value={profile.home_purchase_timeline} onValueChange={(val) => setProfile({...profile, home_purchase_timeline: val, wants_to_buy_home: val !== 'no_plans'})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1-2_years">1-2 years</SelectItem>
                                            <SelectItem value="3-5_years">3-5 years</SelectItem>
                                            <SelectItem value="5+_years">5+ years</SelectItem>
                                            <SelectItem value="no_plans">No plans</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Safety Net */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-light flex items-center gap-2">
                                <Shield className="w-5 h-5 text-[#4A90E2]" />
                                Financial Safety Net
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Emergency Fund (Months of Expenses)</Label>
                                    <Input
                                        type="number"
                                        value={profile.emergency_fund_months}
                                        onChange={(e) => setProfile({...profile, emergency_fund_months: parseFloat(e.target.value)})}
                                        placeholder="3-6 months recommended"
                                    />
                                </div>
                                <div>
                                    <Label>Current Debt Load</Label>
                                    <Select value={profile.current_debt_load} onValueChange={(val) => setProfile({...profile, current_debt_load: val})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No debt</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="moderate">Moderate</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label>Insurance Coverage</Label>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span>Life Insurance</span>
                                    <input
                                        type="checkbox"
                                        checked={profile.has_life_insurance}
                                        onChange={(e) => setProfile({...profile, has_life_insurance: e.target.checked})}
                                        className="w-5 h-5"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span>Health Insurance</span>
                                    <input
                                        type="checkbox"
                                        checked={profile.has_health_insurance}
                                        onChange={(e) => setProfile({...profile, has_health_insurance: e.target.checked})}
                                        className="w-5 h-5"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span>Disability Insurance</span>
                                    <input
                                        type="checkbox"
                                        checked={profile.has_disability_insurance}
                                        onChange={(e) => setProfile({...profile, has_disability_insurance: e.target.checked})}
                                        className="w-5 h-5"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Expected Major Expenses */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-light flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-[#4A90E2]" />
                                Expected Major Expenses
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {profile.expected_major_expenses.map((exp, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{exp.description}</p>
                                        <p className="text-sm text-gray-600">${exp.amount.toLocaleString()} • {exp.timeline}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => removeExpense(idx)}>
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                </div>
                            ))}
                            <div className="grid grid-cols-4 gap-2">
                                <Input
                                    placeholder="Description"
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                                />
                                <Input
                                    type="number"
                                    placeholder="Amount"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                                />
                                <Input
                                    placeholder="Timeline"
                                    value={newExpense.timeline}
                                    onChange={(e) => setNewExpense({...newExpense, timeline: e.target.value})}
                                />
                                <Button onClick={addExpense} variant="outline">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <Button
                        onClick={() => saveMutation.mutate()}
                        disabled={saveMutation.isPending}
                        className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] h-12"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saveMutation.isPending ? 'Saving...' : 'Save Financial Profile'}
                    </Button>
                </div>
            </div>
        </div>
    );
}