-- ================================================
-- VERMIETIFY DATABASE SCHEMA
-- Multi-Tenant Property Management Platform
-- ================================================

-- 1. Create Role Enum
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- 2. Create unit_status Enum
CREATE TYPE public.unit_status AS ENUM ('rented', 'vacant', 'renovating');

-- 3. Create building_type Enum
CREATE TYPE public.building_type AS ENUM ('apartment', 'house', 'commercial', 'mixed');

-- 4. Create transaction_type Enum
CREATE TYPE public.transaction_type AS ENUM ('rent', 'deposit', 'utility', 'repair', 'insurance', 'tax', 'other_income', 'other_expense');

-- 5. Create document_type Enum
CREATE TYPE public.document_type AS ENUM ('contract', 'protocol', 'invoice', 'insurance', 'tax', 'correspondence', 'other');

-- ================================================
-- ORGANIZATIONS TABLE
-- ================================================
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ================================================
-- PROFILES TABLE
-- ================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ================================================
-- USER_ROLES TABLE (Separate from profiles for security)
-- ================================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ================================================
-- BUILDINGS TABLE
-- ================================================
CREATE TABLE public.buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    building_type public.building_type NOT NULL DEFAULT 'apartment',
    year_built INTEGER,
    total_area DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

-- ================================================
-- UNITS TABLE
-- ================================================
CREATE TABLE public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL,
    floor INTEGER,
    area DECIMAL(10,2) NOT NULL,
    rooms DECIMAL(3,1) NOT NULL,
    rent_amount DECIMAL(10,2) NOT NULL,
    utility_advance DECIMAL(10,2) DEFAULT 0,
    status public.unit_status NOT NULL DEFAULT 'vacant',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- ================================================
-- TENANTS TABLE
-- ================================================
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- ================================================
-- LEASES TABLE
-- ================================================
CREATE TABLE public.leases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    rent_amount DECIMAL(10,2) NOT NULL,
    utility_advance DECIMAL(10,2) DEFAULT 0,
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    deposit_paid BOOLEAN DEFAULT false,
    payment_day INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;

-- ================================================
-- TRANSACTIONS TABLE
-- ================================================
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    lease_id UUID REFERENCES public.leases(id) ON DELETE SET NULL,
    building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
    transaction_type public.transaction_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL,
    is_income BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ================================================
-- DOCUMENTS TABLE
-- ================================================
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    lease_id UUID REFERENCES public.leases(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    document_type public.document_type NOT NULL DEFAULT 'other',
    file_url TEXT NOT NULL,
    file_size INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ================================================
-- UTILITY_COSTS TABLE
-- ================================================
CREATE TABLE public.utility_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    cost_type TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    billing_year INTEGER NOT NULL,
    distribution_key TEXT NOT NULL DEFAULT 'area',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.utility_costs ENABLE ROW LEVEL SECURITY;

-- ================================================
-- MESSAGES TABLE
-- ================================================
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMPTZ,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ================================================
-- TASKS TABLE (for open tasks/reminders)
-- ================================================
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    is_completed BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'medium',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ================================================
-- SECURITY DEFINER FUNCTIONS
-- ================================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to get user's organization_id
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id
    FROM public.profiles
    WHERE user_id = _user_id
$$;

-- ================================================
-- ROW LEVEL SECURITY POLICIES
-- ================================================

-- Organizations: Users can only access their own organization
CREATE POLICY "Users can view their own organization"
    ON public.organizations FOR SELECT
    TO authenticated
    USING (id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update their own organization"
    ON public.organizations FOR UPDATE
    TO authenticated
    USING (id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert organizations"
    ON public.organizations FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Profiles: Users can manage their own profile
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- User roles: Only view own roles
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Buildings: Access based on organization
CREATE POLICY "Users can view buildings in their organization"
    ON public.buildings FOR SELECT
    TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert buildings in their organization"
    ON public.buildings FOR INSERT
    TO authenticated
    WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update buildings in their organization"
    ON public.buildings FOR UPDATE
    TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete buildings in their organization"
    ON public.buildings FOR DELETE
    TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Units: Access based on building's organization
CREATE POLICY "Users can view units in their buildings"
    ON public.units FOR SELECT
    TO authenticated
    USING (
        building_id IN (
            SELECT id FROM public.buildings 
            WHERE organization_id = public.get_user_organization_id(auth.uid())
        )
    );

CREATE POLICY "Users can insert units in their buildings"
    ON public.units FOR INSERT
    TO authenticated
    WITH CHECK (
        building_id IN (
            SELECT id FROM public.buildings 
            WHERE organization_id = public.get_user_organization_id(auth.uid())
        )
    );

CREATE POLICY "Users can update units in their buildings"
    ON public.units FOR UPDATE
    TO authenticated
    USING (
        building_id IN (
            SELECT id FROM public.buildings 
            WHERE organization_id = public.get_user_organization_id(auth.uid())
        )
    );

CREATE POLICY "Users can delete units in their buildings"
    ON public.units FOR DELETE
    TO authenticated
    USING (
        building_id IN (
            SELECT id FROM public.buildings 
            WHERE organization_id = public.get_user_organization_id(auth.uid())
        )
    );

-- Tenants: Access based on organization
CREATE POLICY "Users can view tenants in their organization"
    ON public.tenants FOR SELECT
    TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert tenants in their organization"
    ON public.tenants FOR INSERT
    TO authenticated
    WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update tenants in their organization"
    ON public.tenants FOR UPDATE
    TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete tenants in their organization"
    ON public.tenants FOR DELETE
    TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Leases: Access through units/tenants
CREATE POLICY "Users can view leases in their organization"
    ON public.leases FOR SELECT
    TO authenticated
    USING (
        tenant_id IN (
            SELECT id FROM public.tenants 
            WHERE organization_id = public.get_user_organization_id(auth.uid())
        )
    );

CREATE POLICY "Users can insert leases in their organization"
    ON public.leases FOR INSERT
    TO authenticated
    WITH CHECK (
        tenant_id IN (
            SELECT id FROM public.tenants 
            WHERE organization_id = public.get_user_organization_id(auth.uid())
        )
    );

CREATE POLICY "Users can update leases in their organization"
    ON public.leases FOR UPDATE
    TO authenticated
    USING (
        tenant_id IN (
            SELECT id FROM public.tenants 
            WHERE organization_id = public.get_user_organization_id(auth.uid())
        )
    );

CREATE POLICY "Users can delete leases in their organization"
    ON public.leases FOR DELETE
    TO authenticated
    USING (
        tenant_id IN (
            SELECT id FROM public.tenants 
            WHERE organization_id = public.get_user_organization_id(auth.uid())
        )
    );

-- Transactions: Access based on organization
CREATE POLICY "Users can view transactions in their organization"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert transactions in their organization"
    ON public.transactions FOR INSERT
    TO authenticated
    WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update transactions in their organization"
    ON public.transactions FOR UPDATE
    TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete transactions in their organization"
    ON public.transactions FOR DELETE
    TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Documents: Access based on organization
CREATE POLICY "Users can view documents in their organization"
    ON public.documents FOR SELECT
    TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert documents in their organization"
    ON public.documents FOR INSERT
    TO authenticated
    WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update documents in their organization"
    ON public.documents FOR UPDATE
    TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete documents in their organization"
    ON public.documents FOR DELETE
    TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Utility costs: Access through buildings
CREATE POLICY "Users can view utility costs in their buildings"
    ON public.utility_costs FOR SELECT
    TO authenticated
    USING (
        building_id IN (
            SELECT id FROM public.buildings 
            WHERE organization_id = public.get_user_organization_id(auth.uid())
        )
    );

CREATE POLICY "Users can insert utility costs in their buildings"
    ON public.utility_costs FOR INSERT
    TO authenticated
    WITH CHECK (
        building_id IN (
            SELECT id FROM public.buildings 
            WHERE organization_id = public.get_user_organization_id(auth.uid())
        )
    );

CREATE POLICY "Users can update utility costs in their buildings"
    ON public.utility_costs FOR UPDATE
    TO authenticated
    USING (
        building_id IN (
            SELECT id FROM public.buildings 
            WHERE organization_id = public.get_user_organization_id(auth.uid())
        )
    );

CREATE POLICY "Users can delete utility costs in their buildings"
    ON public.utility_costs FOR DELETE
    TO authenticated
    USING (
        building_id IN (
            SELECT id FROM public.buildings 
            WHERE organization_id = public.get_user_organization_id(auth.uid())
        )
    );

-- Messages: Access based on organization
CREATE POLICY "Users can view messages in their organization"
    ON public.messages FOR SELECT
    TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert messages in their organization"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update messages in their organization"
    ON public.messages FOR UPDATE
    TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete messages in their organization"
    ON public.messages FOR DELETE
    TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Tasks: Access based on organization
CREATE POLICY "Users can view tasks in their organization"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert tasks in their organization"
    ON public.tasks FOR INSERT
    TO authenticated
    WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update tasks in their organization"
    ON public.tasks FOR UPDATE
    TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete tasks in their organization"
    ON public.tasks FOR DELETE
    TO authenticated
    USING (organization_id = public.get_user_organization_id(auth.uid()));

-- ================================================
-- UPDATED_AT TRIGGERS
-- ================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_buildings_updated_at
    BEFORE UPDATE ON public.buildings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_units_updated_at
    BEFORE UPDATE ON public.units
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_leases_updated_at
    BEFORE UPDATE ON public.leases
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_utility_costs_updated_at
    BEFORE UPDATE ON public.utility_costs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX idx_buildings_organization_id ON public.buildings(organization_id);
CREATE INDEX idx_units_building_id ON public.units(building_id);
CREATE INDEX idx_tenants_organization_id ON public.tenants(organization_id);
CREATE INDEX idx_leases_unit_id ON public.leases(unit_id);
CREATE INDEX idx_leases_tenant_id ON public.leases(tenant_id);
CREATE INDEX idx_transactions_organization_id ON public.transactions(organization_id);
CREATE INDEX idx_transactions_lease_id ON public.transactions(lease_id);
CREATE INDEX idx_documents_organization_id ON public.documents(organization_id);
CREATE INDEX idx_utility_costs_building_id ON public.utility_costs(building_id);
CREATE INDEX idx_messages_organization_id ON public.messages(organization_id);
CREATE INDEX idx_tasks_organization_id ON public.tasks(organization_id);
