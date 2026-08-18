--
-- PostgreSQL database dump
--

\restrict EygQrQPqIvxDkcnxb0E1xbH82Vmgg9Sie4bNRIcHpl7v1V38fsMHVL9ZHt4LraH

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'traveler',
    'agent',
    'admin',
    'useradmin',
    'superadmin',
    'support'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- Name: user_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'suspended',
    'pending',
    'deleted'
);


ALTER TYPE public.user_status OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agent_package_components; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_package_components (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    package_id bigint NOT NULL,
    component_type character varying(20) NOT NULL,
    title text NOT NULL,
    description text,
    provider text,
    price_per_person numeric(10,2) DEFAULT 0 NOT NULL,
    is_included boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT agent_package_components_component_type_check CHECK (((component_type)::text = ANY ((ARRAY['hotel'::character varying, 'flight'::character varying, 'activity'::character varying, 'transfer'::character varying])::text[])))
);


ALTER TABLE public.agent_package_components OWNER TO postgres;

--
-- Name: agent_packages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_packages (
    id bigint NOT NULL,
    provider_id bigint NOT NULL,
    provider_type character varying(20) NOT NULL,
    destination_name character varying(255) NOT NULL,
    package_name character varying(255) NOT NULL,
    package_type character varying(20) NOT NULL,
    travel_mode character varying(50),
    summary text,
    description text,
    duration_days integer,
    duration_nights integer,
    base_price numeric(12,2),
    currency_code character(3) DEFAULT 'USD'::bpchar,
    platform_service_fee_type character varying(20),
    platform_service_fee_value numeric(12,2),
    min_travelers integer DEFAULT 1,
    max_travelers integer,
    is_customizable boolean DEFAULT false,
    status character varying(20) DEFAULT 'draft'::character varying,
    is_active boolean DEFAULT true NOT NULL,
    featured_until timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.agent_packages OWNER TO postgres;

--
-- Name: agent_packages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agent_packages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agent_packages_id_seq OWNER TO postgres;

--
-- Name: agent_packages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agent_packages_id_seq OWNED BY public.agent_packages.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    user_id uuid,
    event_type character varying(50) NOT NULL,
    ip_address inet,
    user_agent text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    session_id integer,
    role character varying(50) NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_messages_id_seq OWNER TO postgres;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: chat_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_sessions (
    id integer NOT NULL,
    user_id uuid,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chat_sessions OWNER TO postgres;

--
-- Name: chat_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_sessions_id_seq OWNER TO postgres;

--
-- Name: chat_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_sessions_id_seq OWNED BY public.chat_sessions.id;


--
-- Name: destinations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.destinations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    trip_id uuid NOT NULL,
    destination_id character varying(100),
    name character varying(255) NOT NULL,
    country character varying(100),
    lat numeric(10,6),
    lng numeric(10,6),
    emoji character varying(10),
    highlights jsonb,
    bookme_deals jsonb,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.destinations OWNER TO postgres;

--
-- Name: logins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.logins (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    session_token text NOT NULL,
    ip_address inet,
    user_agent text,
    issued_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked boolean DEFAULT false NOT NULL,
    revoked_at timestamp with time zone
);


ALTER TABLE public.logins OWNER TO postgres;

--
-- Name: logins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.logins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.logins_id_seq OWNER TO postgres;

--
-- Name: logins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.logins_id_seq OWNED BY public.logins.id;


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_resets (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.password_resets OWNER TO postgres;

--
-- Name: password_resets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_resets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_resets_id_seq OWNER TO postgres;

--
-- Name: password_resets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_resets_id_seq OWNED BY public.password_resets.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_migrations (
    id integer NOT NULL,
    filename character varying(255) NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.schema_migrations OWNER TO postgres;

--
-- Name: schema_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schema_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schema_migrations_id_seq OWNER TO postgres;

--
-- Name: schema_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schema_migrations_id_seq OWNED BY public.schema_migrations.id;


--
-- Name: trips; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trips (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255),
    summary text,
    start_city character varying(100),
    travelers integer DEFAULT 1,
    days integer DEFAULT 1,
    budget_level character varying(50),
    suggestions jsonb,
    status character varying(50) DEFAULT 'saved'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    selected_components jsonb DEFAULT '[]'::jsonb,
    total_price_per_person numeric(10,2) DEFAULT 0,
    total_price_all numeric(10,2) DEFAULT 0,
    selected_package_ids jsonb DEFAULT '[]'::jsonb,
    is_modified boolean DEFAULT false NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    CONSTRAINT chk_budget_level CHECK (((budget_level)::text = ANY ((ARRAY['budget'::character varying, 'moderate'::character varying, 'luxury'::character varying])::text[])))
);


ALTER TABLE public.trips OWNER TO postgres;

--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_preferences (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    budget_amount numeric(12,2),
    currency character varying(10) DEFAULT 'USD'::character varying,
    destination character varying(255),
    location_types jsonb DEFAULT '[]'::jsonb NOT NULL,
    travel_style jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_preferences OWNER TO postgres;

--
-- Name: user_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_preferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_preferences_id_seq OWNER TO postgres;

--
-- Name: user_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_preferences_id_seq OWNED BY public.user_preferences.id;


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_profiles (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    dob date,
    nationality character varying(100),
    avatar_url text,
    bio text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    agency_name text,
    agency_license text,
    agency_logo_url text,
    specialties jsonb DEFAULT '[]'::jsonb NOT NULL
);


ALTER TABLE public.user_profiles OWNER TO postgres;

--
-- Name: user_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_profiles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_profiles_id_seq OWNER TO postgres;

--
-- Name: user_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_profiles_id_seq OWNED BY public.user_profiles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100),
    email character varying(255) NOT NULL,
    phone character varying(30),
    password_hash text,
    role_type public.user_role DEFAULT 'traveler'::public.user_role NOT NULL,
    status public.user_status DEFAULT 'pending'::public.user_status NOT NULL,
    auth_provider character varying(30) DEFAULT 'local'::character varying NOT NULL,
    provider_id character varying(255),
    email_verified boolean DEFAULT false NOT NULL,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: agent_packages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_packages ALTER COLUMN id SET DEFAULT nextval('public.agent_packages_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: chat_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions ALTER COLUMN id SET DEFAULT nextval('public.chat_sessions_id_seq'::regclass);


--
-- Name: logins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logins ALTER COLUMN id SET DEFAULT nextval('public.logins_id_seq'::regclass);


--
-- Name: password_resets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets ALTER COLUMN id SET DEFAULT nextval('public.password_resets_id_seq'::regclass);


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Name: user_preferences id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences ALTER COLUMN id SET DEFAULT nextval('public.user_preferences_id_seq'::regclass);


--
-- Name: user_profiles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles ALTER COLUMN id SET DEFAULT nextval('public.user_profiles_id_seq'::regclass);


--
-- Data for Name: agent_package_components; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_package_components (id, package_id, component_type, title, description, provider, price_per_person, is_included, sort_order, created_at) FROM stdin;
030035a8-568c-49a7-a44f-c6d00c9f76a4	1	flight	Auckland Return Flights	Return economy flights from Christchurch to Auckland	Air New Zealand	320.00	t	1	2026-07-15 17:48:55.689533+12
05be1cbe-88cd-4ba7-ba56-bd3f93c33999	1	hotel	Hilton Auckland (4 nights)	Superior room with harbour view, breakfast included	Hilton Auckland	480.00	t	2	2026-07-15 17:48:55.689533+12
6cc07fa4-9a00-4291-bf4d-d408639cceab	1	hotel	Waiheke Island Boutique Stay (2 nights)	Charming vineyard cottage, breakfast included	The Boatshed	220.00	t	3	2026-07-15 17:48:55.689533+12
74cd75ce-338e-45bd-b757-91ab547b52fa	1	activity	Auckland Sky Tower Entry	Express entry to Sky Tower with glass floor experience	Sky Tower	35.00	t	4	2026-07-15 17:48:55.689533+12
02b54a9f-4df1-43fc-b7e8-d9f50fc427aa	1	activity	Waiheke Wine Trail Tour	Full-day guided tour visiting 4 boutique wineries	Waiheke Winery Co	120.00	t	5	2026-07-15 17:48:55.689533+12
195c8f74-2bfe-4768-b0c5-7120ecc2a9c5	1	transfer	Airport Transfers (Return)	Private vehicle transfers between Auckland Airport and hotel	NZ Transfers	80.00	t	6	2026-07-15 17:48:55.689533+12
8a9a5af3-5164-4bf1-b269-b7c796510744	1	activity	Auckland Harbour Sailing Cruise	Sunset sailing cruise on the Waitemata Harbour (optional add-on)	Sail Auckland	95.00	f	7	2026-07-15 17:48:55.689533+12
84acbd41-95a0-4e0f-9832-b3947341afa1	2	transfer	Auckland to Rotorua Coach Transfer	Comfortable coach service with scenic stops	InterCity	55.00	t	1	2026-07-15 17:48:55.689533+12
6c9d519c-aafd-4cab-9143-9c347626d111	2	hotel	Sudima Rotorua (2 nights)	Geothermal spa hotel, room with natural hot spring access	Sudima Hotels	240.00	t	2	2026-07-15 17:48:55.689533+12
e399cd91-c0b6-45ec-8795-c84881eb9928	2	activity	Te Puia Geothermal & Maori Culture	Guided tour of Te Puia, geyser viewing, and hangi dinner	Te Puia	145.00	t	3	2026-07-15 17:48:55.689533+12
eb99dc49-41cb-46f4-9d04-470f518a7617	2	activity	Redwoods Treewalk	Illuminated night walk through the ancient Whakarewarewa forest	Redwoods	45.00	t	4	2026-07-15 17:48:55.689533+12
bd2c97f8-9bcc-4ac3-9d21-443c01028e84	2	activity	Wai-O-Tapu Thermal Wonderland	Self-guided tour of New Zealand's most colourful geothermal park	Wai-O-Tapu	40.00	f	5	2026-07-15 17:48:55.689533+12
ea6f05ed-d076-46ac-b54c-8dd5cb0388a2	2	activity	White Water Rafting — Kaituna River	Grade 5 rafting over the highest commercially rafted waterfall	Kaituna Cascades	99.00	f	6	2026-07-15 17:48:55.689533+12
b01159e6-ad74-4486-b6ab-f92e5fbf7caf	3	flight	International Return Flights	Return economy flights ex-Sydney to Auckland, Wellington to Sydney	Air New Zealand	850.00	t	1	2026-07-15 17:48:55.689533+12
1e6b6337-172b-403f-abb0-0ad30aadddb7	3	hotel	Auckland — Cordis Hotel (2 nights)	5-star luxury in central Auckland, breakfast included	Cordis Auckland	380.00	t	2	2026-07-15 17:48:55.689533+12
2afdfa47-c531-4b68-b6f4-12540bab05a6	3	hotel	Rotorua — Pullman Hotel (2 nights)	Contemporary hotel near geothermal attractions	Pullman Rotorua	280.00	t	3	2026-07-15 17:48:55.689533+12
9be5ab08-9d58-4172-abb5-ff925a134e01	3	hotel	Taupo — Huka Lodge (1 night)	New Zealand's most iconic luxury lodge on the Waikato River	Huka Lodge	420.00	t	4	2026-07-15 17:48:55.689533+12
dbd86b4a-f798-48d5-b19a-76fbe127ef9e	3	hotel	Wellington — InterContinental (2 nights)	Harbourside luxury with stunning views	InterContinental	360.00	t	5	2026-07-15 17:48:55.689533+12
e05e0803-1a66-4913-8cb6-239d128ac14a	3	activity	Tongariro Alpine Crossing — Guided	New Zealand's best 1-day hike with certified mountain guide	Adventure HQ	180.00	t	6	2026-07-15 17:48:55.689533+12
5ef906be-608a-45d1-9aaf-3bf67cd993e7	3	activity	Hobbiton Movie Set Tour	Guided tour of the original Hobbiton film set in Matamata	Hobbiton Tours	120.00	t	7	2026-07-15 17:48:55.689533+12
50b66f53-145c-4323-9d6a-216e21df1768	3	transfer	All Inter-City Transfers	Private vehicle between all destinations throughout the tour	NZ Transfers	220.00	t	8	2026-07-15 17:48:55.689533+12
bf31e46d-cca3-4acf-9c99-8b4e793696da	3	activity	Wellington Food & Culture Tour	Half-day guided walking tour of Wellington's best eateries	Taste Wellington	85.00	f	9	2026-07-15 17:48:55.689533+12
f656790d-91e8-417b-90be-9bb76fa176c7	3	activity	Skydive over Lake Taupo	Tandem skydive from 15,000ft with panoramic volcanic views	Skydive Taupo	299.00	f	10	2026-07-15 17:48:55.689533+12
\.


--
-- Data for Name: agent_packages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_packages (id, provider_id, provider_type, destination_name, package_name, package_type, travel_mode, summary, description, duration_days, duration_nights, base_price, currency_code, platform_service_fee_type, platform_service_fee_value, min_travelers, max_travelers, is_customizable, status, is_active, featured_until, created_at, updated_at) FROM stdin;
4	26	Agent	Dubai	Cheapest 5-Days trip to Dubai for family of 3 - 001	Family	Flight	Cheapest 5-Days trip to Dubai for maximum 3 persons (family of 3)	Cheapest 5-Days trip to Dubai for maximum 3 persons (family of 3)	5	4	6000.00	NZD	fixed	\N	1	3	t	active	t	\N	2026-07-21 15:32:47.565501	2026-07-21 16:40:08.527731
6	14	Agent	Rotorua	Rotorua Thermal Splendour	family	car	Relax in mud pools	Thermal springs family tour and spa inclusions	3	2	650.00	NZD	percentage	5.00	2	6	f	draft	t	\N	2026-07-21 16:29:28.522032	2026-07-21 16:29:28.522032
1	13	Agent	Auckland	Auckland 7-Days Explorer Budget Plan	Budget 7-Days	Air	A complete Auckland experience covering the city highlights, Waiheke Island wine trail, and the stunning Coromandel Peninsula. Flights, accommodation, and select activities included.	Auckland 7-Day trip with Flights, accommodation, and select activities included.	7	6	1299.00	NZD	percentage	20.00	1	10	f	active	t	2026-09-30 23:59:59	2026-07-15 17:48:55.689533	2026-07-15 17:48:55.689533
2	9	Agent	Rotorua	Rotorua Geothermal Weekend Mid-Range Plan	Mid-Range 3-Days	Air	Immerse yourself in Rotorua's famous geothermal wonders, Maori culture, and lush redwood forests. Perfect long-weekend escape from Auckland.	A complete Rotorua Geothermal Weekend trip covering geothermal wonders, culture and forest walk.	3	2	649.00	NZD	percentage	20.00	1	10	f	active	t	2026-10-30 23:59:59	2026-07-15 17:48:55.689533	2026-07-15 17:48:55.689533
5	3	Agent	Queenstown	Queenstown Ski Explorer Package	leisure	flight	5-day adventure in Queenstown	Skiing and Gondola ride with hotel included	5	4	1500.00	NZD	fixed	50.00	1	4	t	active	t	\N	2026-07-21 16:29:28.522032	2026-07-21 16:29:28.522032
3	3	Agent	Wellington	NZ North Island Grand Tour Mid-Range Plan	Mid-Range 10-Days	Air	The ultimate North Island experience: Auckland city, Rotorua geothermals, Tongariro Alpine Crossing, Tauranga beaches, and Wellington's vibrant arts scene. All-inclusive.	The ultimate 10-day North Island experience with hotels, transport, and premium activities.	10	9	2499.00	NZD	percentage	20.00	1	10	f	active	t	2026-11-30 23:59:59	2026-07-15 17:48:55.689533	2026-07-15 17:48:55.689533
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, event_type, ip_address, user_agent, metadata, created_at) FROM stdin;
1	\N	login_failed	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "mya.sourceinfinity@gmail.com", "reason": "user_not_found"}	2026-04-29 10:15:25.317002+12
2	368387ce-29cb-4693-af69-a7108ba47982	signup	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "mya.sourceinfinity@gmail.com", "auth_provider": "local"}	2026-04-29 10:24:38.786236+12
3	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-04-29 10:31:17.597499+12
4	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-04-29 12:17:17.941765+12
5	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-04-29 12:26:30.494821+12
6	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-04-29 16:12:52.776914+12
7	5838ed8b-0625-40e7-b627-de8f0d081561	signup	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "abcd@gmail.com", "auth_provider": "local"}	2026-05-01 12:42:30.144056+12
9	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-05-01 16:15:40.366516+12
10	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	signup	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "mya.sourceinfinity@gmail.com", "auth_provider": "google"}	2026-05-01 16:15:59.551268+12
11	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-05-08 10:22:37.844841+12
12	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-05-08 10:46:18.028917+12
13	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-05-08 10:55:51.619512+12
14	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-05-08 11:19:22.067448+12
15	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-05-08 11:32:01.047436+12
16	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-05-08 11:34:47.996628+12
17	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-05-08 12:18:07.184006+12
18	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-05-08 12:20:51.892713+12
19	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-05-08 12:27:53.372426+12
20	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-05-08 14:16:40.903038+12
21	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-05-08 14:23:54.916549+12
22	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-05-08 15:45:46.622758+12
23	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-05-08 15:47:48.442672+12
24	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-05-08 16:08:59.058243+12
25	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-05-08 16:12:49.994196+12
26	368387ce-29cb-4693-af69-a7108ba47982	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-05-08 16:39:06.445302+12
27	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-15 08:47:43.681355+12
28	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-15 08:50:18.627091+12
29	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-15 09:12:59.724505+12
30	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-15 09:17:37.994945+12
31	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-15 11:35:04.163751+12
32	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.119.0 Chrome/142.0.7444.265 Electron/39.8.8 Safari/537.36	{"auth_provider": "google"}	2026-05-15 12:42:32.928691+12
33	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-05-15 12:52:15.188107+12
34	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-05-15 13:46:44.796815+12
35	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-05-15 14:11:55.981958+12
36	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.120.0 Chrome/142.0.7444.265 Electron/39.8.8 Safari/537.36	{"auth_provider": "google"}	2026-05-15 16:21:38.792003+12
37	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-19 15:00:01.104997+12
38	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-19 15:17:01.756729+12
39	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-19 15:43:44.38508+12
40	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-19 23:51:24.072934+12
41	b7ab8fd9-987c-4d8d-b61b-e5af7df176f3	signup	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"email": "testuser2358@example.com", "auth_provider": "local"}	2026-05-19 23:55:31.211113+12
42	\N	login_failed	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"email": "test@example.com", "reason": "user_not_found"}	2026-05-19 23:57:36.809929+12
43	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-05-19 23:57:44.125135+12
44	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-20 00:09:47.547719+12
45	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-20 00:31:05.936382+12
46	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-20 01:05:25.921159+12
47	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-20 10:20:26.022858+12
48	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-20 11:52:27.394384+12
49	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-20 12:11:52.579677+12
50	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-20 12:46:29.295802+12
51	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-05-20 15:29:24.564036+12
52	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-05-20 15:31:37.948996+12
53	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-22 12:13:52.436077+12
54	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-22 12:35:36.295928+12
55	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-22 14:38:24.280895+12
56	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-22 14:38:43.4062+12
57	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-22 14:39:24.84944+12
58	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-25 13:43:46.137309+12
59	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-25 14:00:38.842151+12
60	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-25 15:24:23.251197+12
61	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-26 20:00:57.624776+12
62	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-27 12:42:59.317332+12
63	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-27 12:45:30.103028+12
64	97d0462c-88f1-447a-a6e3-7fc7f0b309eb	signup	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"email": "myathuzarlwyn@gmail.com", "auth_provider": "local"}	2026-05-27 13:55:49.267365+12
65	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-27 14:42:11.156186+12
66	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-27 15:00:24.984132+12
67	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	{"auth_provider": "google"}	2026-05-27 15:17:19.255941+12
68	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	{"auth_provider": "google"}	2026-06-08 12:48:30.080221+12
69	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	{"auth_provider": "google"}	2026-06-08 15:04:08.580372+12
70	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	{"auth_provider": "google"}	2026-06-08 15:36:38.35906+12
71	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	{"auth_provider": "google"}	2026-06-17 12:23:39.941665+12
72	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	{"auth_provider": "google"}	2026-06-17 12:40:00.252435+12
73	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	{"auth_provider": "google"}	2026-06-17 12:46:17.61444+12
74	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	{"auth_provider": "google"}	2026-06-17 12:48:56.232892+12
75	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-06-17 13:12:02.627021+12
76	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-06-17 13:18:50.905102+12
77	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	{"auth_provider": "google"}	2026-06-17 13:41:50.013179+12
78	\N	login_failed	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "agent@travelai.com", "reason": "user_not_found"}	2026-06-17 13:42:48.165893+12
79	\N	login_failed	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "superadmin@travelai.com", "reason": "user_not_found"}	2026-06-17 13:43:28.498573+12
80	\N	login_failed	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "admin@example.com", "reason": "user_not_found"}	2026-06-17 13:44:09.973356+12
81	\N	login_failed	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "agent@travelai.com", "reason": "user_not_found"}	2026-06-17 13:44:50.761031+12
82	\N	login_failed	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "superadmin@travelai.com", "reason": "user_not_found"}	2026-06-17 13:45:34.508287+12
83	\N	login_failed	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "superadmin@travelai.com", "reason": "user_not_found"}	2026-06-17 13:47:00.437173+12
84	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-06-17 13:48:25.873931+12
85	\N	login_failed	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "traveler@travelai.com", "reason": "user_not_found"}	2026-06-17 13:51:19.388195+12
86	\N	login_failed	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "admin@travelai.com", "reason": "user_not_found"}	2026-06-17 13:52:20.17726+12
87	\N	login_failed	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "user@example.com", "reason": "user_not_found"}	2026-06-17 13:53:21.408563+12
88	aa2f7d86-258b-42fa-ae41-b2bf5fd5173e	signup	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"email": "testuser@travelai.com", "auth_provider": "local"}	2026-06-17 13:56:13.575501+12
89	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-06-17 14:02:23.463154+12
90	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-06-17 14:06:34.213892+12
91	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-06-17 15:39:49.876565+12
92	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-06-17 15:41:19.602381+12
93	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-06-17 15:56:44.162245+12
94	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	{"auth_provider": "google"}	2026-06-17 16:15:32.638253+12
95	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-06-17 16:54:31.882656+12
96	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-06-17 16:56:26.807208+12
97	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-06-21 19:19:24.085912+12
98	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15	{"auth_provider": "google"}	2026-06-22 14:56:04.243796+12
99	467ac61c-9abc-4519-b1bf-646ac1404b39	signup	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15	{"email": "johndoe@testing123.com", "auth_provider": "local"}	2026-06-22 15:12:09.043117+12
100	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15	{"auth_provider": "google"}	2026-06-22 15:15:26.995153+12
101	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	{"auth_provider": "google"}	2026-06-29 13:06:00.107415+12
102	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	{"auth_provider": "google"}	2026-06-29 14:01:56.323402+12
103	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	{"auth_provider": "google"}	2026-07-01 14:43:46.872082+12
104	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	{"auth_provider": "google"}	2026-07-01 15:22:01.115685+12
105	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	{"auth_provider": "google"}	2026-07-07 19:37:08.416596+12
106	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	{"auth_provider": "google"}	2026-07-07 19:52:42.288351+12
107	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	{"auth_provider": "google"}	2026-07-07 21:26:44.023991+12
108	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	{"auth_provider": "google"}	2026-07-08 11:51:03.892321+12
109	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	{"auth_provider": "google"}	2026-07-08 11:58:53.616234+12
110	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	{"auth_provider": "google"}	2026-07-13 12:16:34.220295+12
111	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	{"auth_provider": "google"}	2026-07-13 13:16:53.931533+12
112	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-13 15:11:33.010066+12
113	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	{"auth_provider": "google"}	2026-07-14 11:43:28.10813+12
114	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	{"auth_provider": "google"}	2026-07-14 12:03:07.2749+12
115	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	{"auth_provider": "google"}	2026-07-14 12:33:37.895916+12
116	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	{"auth_provider": "google"}	2026-07-14 12:50:59.417438+12
117	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-15 16:23:27.967448+12
118	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-15 16:41:13.845325+12
119	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-15 16:50:26.588992+12
120	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	{"auth_provider": "google"}	2026-07-20 12:46:09.894341+12
121	a3de112d-dbc4-43b4-af9e-016b01286f89	signup	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"email": "traveler_test_123@example.com", "auth_provider": "local"}	2026-07-20 12:53:14.788341+12
122	\N	login_failed	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"email": "admin@example.com", "reason": "user_not_found"}	2026-07-20 12:56:01.503237+12
123	f5bb7aa0-9ac1-4b1c-8003-6435a6f96b05	signup	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"email": "traveler_test_456@example.com", "auth_provider": "local"}	2026-07-20 12:57:28.87092+12
124	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-20 13:01:04.917907+12
125	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-20 14:12:53.683127+12
126	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-20 14:28:34.046338+12
127	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-20 14:31:00.063301+12
128	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-20 14:33:34.089044+12
129	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-20 14:37:03.518553+12
130	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	{"auth_provider": "google"}	2026-07-20 14:38:09.628155+12
131	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-20 14:39:23.41022+12
132	\N	login_failed	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"email": "agent@travelai.com", "reason": "user_not_found"}	2026-07-20 14:41:25.543402+12
133	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-20 14:41:57.53459+12
134	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-20 14:57:08.180229+12
135	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	{"auth_provider": "google"}	2026-07-20 15:37:10.620133+12
136	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	{"auth_provider": "google"}	2026-07-20 15:57:12.361147+12
137	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-21 12:15:28.063926+12
138	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-21 12:43:32.43522+12
139	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-21 12:49:14.591709+12
140	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-21 15:29:51.045649+12
141	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-21 15:46:46.915787+12
142	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-21 15:57:25.843682+12
143	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-21 15:58:35.109596+12
144	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-21 16:24:00.223023+12
145	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-21 16:32:41.439425+12
146	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-23 15:54:06.926135+12
147	48339ec4-c251-4476-8b7c-9aa45d59f9d4	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-07-23 16:19:08.611807+12
148	48339ec4-c251-4476-8b7c-9aa45d59f9d4	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-07-23 16:24:51.086574+12
149	\N	login_failed	::1	\N	{"email": "superadmin@miatravelai.com", "reason": "user_not_found"}	2026-07-23 16:32:17.140262+12
150	48339ec4-c251-4476-8b7c-9aa45d59f9d4	login_failed	::1	\N	{"reason": "bad_password"}	2026-07-23 16:33:36.439879+12
151	368387ce-29cb-4693-af69-a7108ba47982	login_failed	::1	\N	{"reason": "bad_password"}	2026-07-23 16:33:36.839347+12
152	48339ec4-c251-4476-8b7c-9aa45d59f9d4	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-07-23 16:34:26.497899+12
153	48339ec4-c251-4476-8b7c-9aa45d59f9d4	login_success	::1	\N	{"auth_provider": "local"}	2026-07-23 16:35:48.170863+12
154	368387ce-29cb-4693-af69-a7108ba47982	login_failed	::1	\N	{"reason": "bad_password"}	2026-07-23 16:35:48.564428+12
155	467ac61c-9abc-4519-b1bf-646ac1404b39	login_failed	::1	\N	{"reason": "bad_password"}	2026-07-23 16:35:48.923575+12
156	48339ec4-c251-4476-8b7c-9aa45d59f9d4	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-07-23 16:37:13.465328+12
157	48339ec4-c251-4476-8b7c-9aa45d59f9d4	agent_status_changed	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"changed_by": "mia.superadmin@travelai.co.nz", "new_status": "suspended", "target_user_id": "f5bb7aa0-9ac1-4b1c-8003-6435a6f96b05"}	2026-07-23 16:40:45.926982+12
158	48339ec4-c251-4476-8b7c-9aa45d59f9d4	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-07-23 16:59:08.491691+12
159	48339ec4-c251-4476-8b7c-9aa45d59f9d4	agent_created	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"email": "emeraldnovam@gmail.com", "created_by": "mia.superadmin@travelai.co.nz", "created_agent_id": "21d0a265-7c5e-4d82-b6cb-417edc7f7c28"}	2026-07-23 17:02:33.876104+12
160	21d0a265-7c5e-4d82-b6cb-417edc7f7c28	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-07-23 17:03:43.968741+12
161	21d0a265-7c5e-4d82-b6cb-417edc7f7c28	login_success	::1	\N	{"auth_provider": "local"}	2026-07-23 17:11:09.388546+12
162	48339ec4-c251-4476-8b7c-9aa45d59f9d4	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-07-23 17:12:50.724338+12
163	48339ec4-c251-4476-8b7c-9aa45d59f9d4	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-07-25 08:32:53.184208+12
164	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-25 10:10:35.175582+12
165	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-25 10:37:00.185066+12
166	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-25 12:09:27.547099+12
167	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-27 09:28:07.948665+12
168	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-27 09:45:02.807061+12
169	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-27 10:01:06.603458+12
170	48339ec4-c251-4476-8b7c-9aa45d59f9d4	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-07-27 10:04:07.400651+12
171	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-27 11:14:20.934944+12
172	48339ec4-c251-4476-8b7c-9aa45d59f9d4	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-07-27 11:14:39.328883+12
173	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-27 12:08:06.402151+12
174	4c8663a6-7539-48e1-afb6-9033d460503e	signup	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.130.0 Chrome/148.0.7778.280 Electron/42.6.0 Safari/537.36	{"email": "shwepinlon26@gmail.com", "auth_provider": "local"}	2026-07-27 12:10:18.631317+12
178	4c8663a6-7539-48e1-afb6-9033d460503e	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	{"auth_provider": "local"}	2026-07-27 12:15:09.293067+12
179	4c8663a6-7539-48e1-afb6-9033d460503e	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	{"auth_provider": "local"}	2026-07-27 12:19:02.105778+12
180	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	{"auth_provider": "google"}	2026-07-27 12:20:17.049212+12
181	48339ec4-c251-4476-8b7c-9aa45d59f9d4	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	{"auth_provider": "local"}	2026-07-27 12:21:09.177075+12
182	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-27 12:23:16.887958+12
183	\N	login_failed	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"email": "testuser@example.com", "reason": "user_not_found"}	2026-07-27 12:48:25.151295+12
184	48339ec4-c251-4476-8b7c-9aa45d59f9d4	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-07-27 12:49:48.604689+12
185	b9de6b4a-6183-4cc7-b2df-6da77f32634f	signup	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"email": "testuser@example.com", "auth_provider": "local"}	2026-07-27 12:56:21.409732+12
186	48339ec4-c251-4476-8b7c-9aa45d59f9d4	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	{"auth_provider": "local"}	2026-07-27 12:58:04.300666+12
187	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	{"auth_provider": "google"}	2026-07-27 12:58:18.354413+12
188	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-27 13:01:00.375137+12
189	48339ec4-c251-4476-8b7c-9aa45d59f9d4	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-07-27 13:05:37.443185+12
190	4c8663a6-7539-48e1-afb6-9033d460503e	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	{"auth_provider": "local"}	2026-07-27 13:08:38.065032+12
191	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-27 13:14:48.720115+12
192	4c8663a6-7539-48e1-afb6-9033d460503e	login_failed	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"reason": "bad_password"}	2026-07-27 13:24:52.374504+12
193	4c8663a6-7539-48e1-afb6-9033d460503e	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "local"}	2026-07-27 13:26:42.916156+12
194	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	login_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	{"auth_provider": "google"}	2026-07-27 14:16:34.264615+12
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (id, session_id, role, content, created_at) FROM stdin;
\.


--
-- Data for Name: chat_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_sessions (id, user_id, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: destinations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.destinations (id, trip_id, destination_id, name, country, lat, lng, emoji, highlights, bookme_deals, sort_order, created_at) FROM stdin;
762d1c00-cadd-4e7f-b011-fce55f5bed1f	93d2697a-a1f5-4da2-8067-46b27bf61a68	auckland	Auckland	New Zealand	-36.848500	174.763300	🌆	["Auckland War Memorial Museum", "Sky Tower", "Waiheke Island"]	[{"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Auckland Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/adventure", "image": "https://images.unsplash.com/photo-1533587851505-d119e13bf0eb?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Auckland - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	0	2026-05-25 13:44:05.296218+12
fb6d8ba6-58a7-4f26-95fe-d7b1af537232	93d2697a-a1f5-4da2-8067-46b27bf61a68	rotorua	Rotorua	New Zealand	-38.136800	176.249700	🌋	["Te Puia", "Rotorua Museum", "Redwoods Treewalk"]	[{"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Rotorua Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/adventure", "image": "https://images.unsplash.com/photo-1506509923831-7b0b30efec98?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Rotorua - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	1	2026-05-25 13:44:05.296218+12
f40409f5-bab5-447a-a212-62de63ba14e6	93d2697a-a1f5-4da2-8067-46b27bf61a68	tongariro-national-park	Tongariro National Park	New Zealand	-39.290800	175.562600	⛰️	["Tongariro Alpine Crossing", "Mount Ngauruhoe", "Whakapapa Village"]	[{"link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tongariro National Park Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/adventure", "image": "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tongariro National Park - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	2	2026-05-25 13:44:05.296218+12
8bd841f0-b1ba-4870-a43f-843d98d93155	93d2697a-a1f5-4da2-8067-46b27bf61a68	tauranga	Tauranga	New Zealand	-37.686900	176.165100	🏖️	["Mount Maunganui", "The Elms Mission Station", "Tauranga Art Gallery"]	[{"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tauranga Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/adventure", "image": "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tauranga - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	3	2026-05-25 13:44:05.296218+12
c9ccec70-7374-41de-82d5-b52ba60a0739	93d2697a-a1f5-4da2-8067-46b27bf61a68	wellington	Wellington	New Zealand	-41.286500	174.776200	🌧️	["Te Papa Museum", "Wellington Botanical Gardens", "Cuba Street"]	[{"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Wellington Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/adventure", "image": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Wellington - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	4	2026-05-25 13:44:05.296218+12
ab6cde8f-7fb9-4e6f-b1c1-f53b5dd2421d	dd2e6cb6-1feb-4b1f-b08a-c87c15a464c4	auckland	Auckland	New Zealand	-36.848500	174.763300	🌆	["Auckland War Memorial Museum", "Sky Tower", "Waiheke Island"]	[{"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Auckland Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/adventure", "image": "https://images.unsplash.com/photo-1533587851505-d119e13bf0eb?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Auckland - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	0	2026-05-25 14:00:47.701488+12
7963837b-d4f8-4b75-8baf-cfdb51a590fe	dd2e6cb6-1feb-4b1f-b08a-c87c15a464c4	rotorua	Rotorua	New Zealand	-38.136800	176.249700	🌋	["Te Puia", "Rotorua Museum", "Redwoods Treewalk"]	[{"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Rotorua Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/adventure", "image": "https://images.unsplash.com/photo-1506509923831-7b0b30efec98?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Rotorua - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	1	2026-05-25 14:00:47.701488+12
21eb2898-c816-4eac-a2f9-58992641b2ef	dd2e6cb6-1feb-4b1f-b08a-c87c15a464c4	tongariro-national-park	Tongariro National Park	New Zealand	-39.290800	175.562600	⛰️	["Tongariro Alpine Crossing", "Mount Ngauruhoe", "Whakapapa Village"]	[{"link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tongariro National Park Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/adventure", "image": "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tongariro National Park - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	2	2026-05-25 14:00:47.701488+12
fd6a0cc5-5c4c-46bf-815b-54c53a2f9197	dd2e6cb6-1feb-4b1f-b08a-c87c15a464c4	tauranga	Tauranga	New Zealand	-37.686900	176.165100	🏖️	["Mount Maunganui", "The Elms Mission Station", "Tauranga Art Gallery"]	[{"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tauranga Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/adventure", "image": "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tauranga - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	3	2026-05-25 14:00:47.701488+12
9d6e5f2a-d28c-4ede-8933-f803b9920489	b54008d8-26a8-4515-a29c-481c9c8fc9aa	wellington	Wellington	New Zealand	-41.286500	174.776200	🇳🇿	["Te Papa Museum", "Cuba Street", "Mount Victoria Lookout", "Weta Workshop Tour"]	[]	0	2026-07-27 13:31:08.751534+12
bc21e7bd-589a-40f7-a849-c86656721032	dd2e6cb6-1feb-4b1f-b08a-c87c15a464c4	wellington	Wellington	New Zealand	-41.286500	174.776200	🌧️	["Te Papa Museum", "Wellington Botanical Gardens", "Cuba Street"]	[{"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Wellington Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/adventure", "image": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Wellington - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	4	2026-05-25 14:00:47.701488+12
03bee176-38f3-4a92-9898-8992b26ff894	7bec2c91-66ac-4034-8adf-9f29c195e8dc	auckland	Auckland	New Zealand	-36.848500	174.763300	🌆	["Auckland War Memorial Museum", "Sky Tower", "Waiheke Island"]	[{"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Auckland Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/adventure", "image": "https://images.unsplash.com/photo-1533587851505-d119e13bf0eb?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Auckland - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	0	2026-05-25 14:01:49.777647+12
da443381-048d-4e16-98a4-08eeac8c6758	7bec2c91-66ac-4034-8adf-9f29c195e8dc	rotorua	Rotorua	New Zealand	-38.136800	176.249700	🌋	["Te Puia", "Rotorua Museum", "Redwoods Treewalk"]	[{"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Rotorua Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/adventure", "image": "https://images.unsplash.com/photo-1506509923831-7b0b30efec98?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Rotorua - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	1	2026-05-25 14:01:49.777647+12
a4c222e3-c388-4fb4-9259-75ba844996dd	7bec2c91-66ac-4034-8adf-9f29c195e8dc	tauranga	Tauranga	New Zealand	-37.686900	176.165100	🏖️	["Mount Maunganui", "The Elms Mission Station", "Tauranga Art Gallery"]	[{"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tauranga Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/adventure", "image": "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tauranga - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	2	2026-05-25 14:01:49.777647+12
e9bc3103-9c7d-445b-95e9-cfd9099963ce	29e1f118-916a-4ead-bbfa-3c55aeda2d8a	auckland	Auckland	New Zealand	-36.848500	174.763300	🌆	["Auckland War Memorial Museum", "Sky Tower", "Waiheke Island"]	[{"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Auckland Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/adventure", "image": "https://images.unsplash.com/photo-1533587851505-d119e13bf0eb?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Auckland - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	0	2026-05-25 14:03:03.921799+12
f585ac51-634e-4304-a542-185096a727f5	29e1f118-916a-4ead-bbfa-3c55aeda2d8a	rotorua	Rotorua	New Zealand	-38.136800	176.249700	🌋	["Te Puia", "Rotorua Museum", "Redwoods Treewalk"]	[{"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Rotorua Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/adventure", "image": "https://images.unsplash.com/photo-1506509923831-7b0b30efec98?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Rotorua - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	1	2026-05-25 14:03:03.921799+12
cd7d77d1-392b-41bb-9c19-813c5223cb8f	29e1f118-916a-4ead-bbfa-3c55aeda2d8a	tongariro-national-park	Tongariro National Park	New Zealand	-39.290800	175.562600	⛰️	["Tongariro Alpine Crossing", "Mount Ngauruhoe", "Whakapapa Village"]	[{"link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tongariro National Park Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/adventure", "image": "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tongariro National Park - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	2	2026-05-25 14:03:03.921799+12
b1a32f2d-b29b-42ca-baeb-49ebaf4c8674	29e1f118-916a-4ead-bbfa-3c55aeda2d8a	tauranga	Tauranga	New Zealand	-37.686900	176.165100	🏖️	["Mount Maunganui", "The Elms Mission Station", "Tauranga Art Gallery"]	[{"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tauranga Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/adventure", "image": "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tauranga - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	3	2026-05-25 14:03:03.921799+12
32560b42-97df-438f-9d48-94e4953ba6b5	8e246c0f-aa10-4021-a509-7e80f06012b4	auckland	Auckland	New Zealand	-36.848500	174.763300	🌆	["Auckland War Memorial Museum", "Sky Tower", "Waiheke Island"]	[{"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Auckland Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/adventure", "image": "https://images.unsplash.com/photo-1533587851505-d119e13bf0eb?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Auckland - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	0	2026-05-25 15:24:36.201956+12
7b8e4352-c31a-4097-9c49-3d434f307736	2c827313-6122-44db-9355-f869b71c8127	dubai	Dubai	United Arab Emirates	25.276987	55.296249	🏙️	["Dubai Mall", "Burj Khalifa", "Desert Safari", "JBR Beach"]	[]	0	2026-07-27 14:19:57.635533+12
d46d6890-5d9e-4f12-9e36-76e3e5a58e3e	8e246c0f-aa10-4021-a509-7e80f06012b4	rotorua	Rotorua	New Zealand	-38.136800	176.249700	🌋	["Te Puia", "Rotorua Museum", "Redwoods Treewalk"]	[{"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Rotorua Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/adventure", "image": "https://images.unsplash.com/photo-1506509923831-7b0b30efec98?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Rotorua - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	1	2026-05-25 15:24:36.201956+12
c8a19064-3d08-4ad2-b67c-57114bb820e3	8e246c0f-aa10-4021-a509-7e80f06012b4	tongariro-national-park	Tongariro National Park	New Zealand	-39.290800	175.562600	⛰️	["Tongariro Alpine Crossing", "Mount Ngauruhoe", "Whakapapa Village"]	[{"link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tongariro National Park Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/adventure", "image": "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tongariro National Park - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	2	2026-05-25 15:24:36.201956+12
504ccc8b-db87-4e53-8220-9b97fe0f21e0	8e246c0f-aa10-4021-a509-7e80f06012b4	tauranga	Tauranga	New Zealand	-37.686900	176.165100	🏖️	["Mount Maunganui", "The Elms Mission Station", "Tauranga Art Gallery"]	[{"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tauranga Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/adventure", "image": "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tauranga - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	3	2026-05-25 15:24:36.201956+12
511b7c74-581f-40ff-94c5-2b840db64cc5	8e246c0f-aa10-4021-a509-7e80f06012b4	wellington	Wellington	New Zealand	-41.286500	174.776200	🌧️	["Te Papa Museum", "Wellington Botanical Gardens", "Cuba Street"]	[{"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Wellington Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/adventure", "image": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Wellington - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	4	2026-05-25 15:24:36.201956+12
2f56edca-6099-4525-a8d8-d2ebf05f71e1	80a06a6d-001e-49a1-bcb3-628d013a5a79	wellington	Wellington	New Zealand	-41.286500	174.776200	🌧️	["Te Papa Museum", "Wellington Botanical Gardens", "Cuba Street"]	[{"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Wellington Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/adventure", "image": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Wellington - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	0	2026-05-25 15:28:07.543127+12
472992c6-91a3-415f-b200-463dbaac2eda	24047103-5e48-44b4-a280-28f166aa2669	auckland	Auckland	New Zealand	-36.848500	174.763300	🌆	["Auckland War Memorial Museum", "Sky Tower", "Waiheke Island"]	[{"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Auckland Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/adventure", "image": "https://images.unsplash.com/photo-1533587851505-d119e13bf0eb?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Auckland - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	0	2026-05-25 15:29:50.361853+12
da4423d1-d5c1-42cc-bc72-09996d521b5f	24047103-5e48-44b4-a280-28f166aa2669	rotorua	Rotorua	New Zealand	-38.136800	176.249700	🌋	["Te Puia", "Rotorua Museum", "Redwoods Treewalk"]	[{"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Rotorua Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/adventure", "image": "https://images.unsplash.com/photo-1506509923831-7b0b30efec98?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Rotorua - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	1	2026-05-25 15:29:50.361853+12
46470aeb-64e5-4cee-935a-7d777a4d6f36	24047103-5e48-44b4-a280-28f166aa2669	tongariro-national-park	Tongariro National Park	New Zealand	-39.290800	175.562600	⛰️	["Tongariro Alpine Crossing", "Mount Ngauruhoe", "Whakapapa Village"]	[{"link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tongariro National Park Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/adventure", "image": "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tongariro National Park - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	2	2026-05-25 15:29:50.361853+12
b8917bc4-bf61-448c-8461-d887ba6a1e01	24047103-5e48-44b4-a280-28f166aa2669	tauranga	Tauranga	New Zealand	-37.686900	176.165100	🏖️	["Mount Maunganui", "The Elms Mission Station", "Tauranga Art Gallery"]	[{"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tauranga Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/adventure", "image": "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tauranga - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	3	2026-05-25 15:29:50.361853+12
55c46079-7e1e-4e08-ad93-35961d9eb757	24047103-5e48-44b4-a280-28f166aa2669	wellington	Wellington	New Zealand	-41.286500	174.776200	🌧️	["Te Papa Museum", "Wellington Botanical Gardens", "Cuba Street"]	[{"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Wellington Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/adventure", "image": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Wellington - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	4	2026-05-25 15:29:50.361853+12
871eb15a-de46-4356-a1a0-d2e51b3ea9ac	dc73a7d4-ae53-40ce-9ca5-b5c105bdec76	wellington	Wellington	New Zealand	-41.286500	174.776200	🌧️	["Te Papa Museum", "Wellington Botanical Gardens", "Cuba Street"]	[{"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Wellington Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/adventure", "image": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Wellington - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	0	2026-05-25 15:31:38.530742+12
e3b1709d-5504-4a7a-8214-ae55342838db	4e317a08-9cec-4359-9eca-9a46a3a4c714	auckland	Auckland	New Zealand	-36.848500	174.763300	🌆	["Auckland War Memorial Museum", "Sky Tower", "Waiheke Island"]	[{"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Auckland Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/adventure", "image": "https://images.unsplash.com/photo-1533587851505-d119e13bf0eb?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Auckland - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	0	2026-05-25 15:32:21.587922+12
201d158d-08fc-4443-b72e-0baa095c3699	4e317a08-9cec-4359-9eca-9a46a3a4c714	rotorua	Rotorua	New Zealand	-38.136800	176.249700	🌋	["Te Puia", "Rotorua Museum", "Redwoods Treewalk"]	[{"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Rotorua Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/adventure", "image": "https://images.unsplash.com/photo-1506509923831-7b0b30efec98?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Rotorua - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	1	2026-05-25 15:32:21.587922+12
4cdd2da1-0078-4ee6-9431-ffb913ce8715	4e317a08-9cec-4359-9eca-9a46a3a4c714	tongariro-national-park	Tongariro National Park	New Zealand	-39.290800	175.562600	⛰️	["Tongariro Alpine Crossing", "Mount Ngauruhoe", "Whakapapa Village"]	[{"link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tongariro National Park Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/adventure", "image": "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tongariro National Park - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	2	2026-05-25 15:32:21.587922+12
dbf68f2d-85a3-4c54-b988-c21683648511	4e317a08-9cec-4359-9eca-9a46a3a4c714	tauranga	Tauranga	New Zealand	-37.686900	176.165100	🏖️	["Mount Maunganui", "The Elms Mission Station", "Tauranga Art Gallery"]	[{"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tauranga Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/adventure", "image": "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tauranga - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	3	2026-05-25 15:32:21.587922+12
71f25d2f-1f46-4212-a0c8-3b584281cba5	4e317a08-9cec-4359-9eca-9a46a3a4c714	wellington	Wellington	New Zealand	-41.286500	174.776200	🌧️	["Te Papa Museum", "Wellington Botanical Gardens", "Cuba Street"]	[{"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Wellington Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/adventure", "image": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Wellington - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	4	2026-05-25 15:32:21.587922+12
37ebfedb-1dc4-4867-b6f9-e105f5c4ec44	71f6407a-18fe-45fe-862a-7278df1e4019	auckland	Auckland	New Zealand	-36.848500	174.763300	🌆	["Auckland War Memorial Museum", "Sky Tower", "Waiheke Island"]	[{"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Auckland Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/adventure", "image": "https://images.unsplash.com/photo-1533587851505-d119e13bf0eb?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Auckland - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	0	2026-05-25 15:35:07.847203+12
e10468d1-e826-4a69-bd02-a4e7072ac94b	71f6407a-18fe-45fe-862a-7278df1e4019	rotorua	Rotorua	New Zealand	-38.136800	176.249700	🌋	["Te Puia", "Rotorua Museum", "Redwoods Treewalk"]	[{"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Rotorua Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/adventure", "image": "https://images.unsplash.com/photo-1506509923831-7b0b30efec98?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Rotorua - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	1	2026-05-25 15:35:07.847203+12
abb0223f-29e9-44fb-8ec1-438668caab0c	392f50ff-b175-4f35-9df5-a57e99bb7a01	tauranga	Tauranga	New Zealand	-37.686900	176.165100	🏖️	["Mount Maunganui", "The Elms Mission Station", "Tauranga Art Gallery"]	[{"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tauranga Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/adventure", "image": "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tauranga - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	0	2026-05-27 15:18:06.171235+12
593ef206-6386-4cbb-b83a-36f6c6d8c608	392f50ff-b175-4f35-9df5-a57e99bb7a01	wellington	Wellington	New Zealand	-41.286500	174.776200	🌧️	["Te Papa Museum", "Wellington Botanical Gardens", "Cuba Street"]	[{"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Wellington Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/adventure", "image": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Wellington - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	1	2026-05-27 15:18:06.171235+12
d3e1f4c5-ca0d-4960-a9ea-bf34aaf7a94f	6e6c99c9-2086-4456-ac4b-247f8d166271	auckland	Auckland	New Zealand	-36.848500	174.763300	🌆	["Auckland War Memorial Museum", "Sky Tower", "Waiheke Island"]	[{"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Auckland Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/adventure", "image": "https://images.unsplash.com/photo-1533587851505-d119e13bf0eb?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Auckland - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	0	2026-06-17 12:49:24.71513+12
7188891a-f1b7-4812-ae9a-ba212b9a648a	6e6c99c9-2086-4456-ac4b-247f8d166271	rotorua	Rotorua	New Zealand	-38.136800	176.249700	🌋	["Te Puia", "Rotorua Museum", "Redwoods Treewalk"]	[{"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Rotorua Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/adventure", "image": "https://images.unsplash.com/photo-1506509923831-7b0b30efec98?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Rotorua - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	1	2026-06-17 12:49:24.71513+12
da789106-bd4a-456d-8b27-7a890ce0ee96	6e6c99c9-2086-4456-ac4b-247f8d166271	tongariro-national-park	Tongariro National Park	New Zealand	-39.290800	175.562600	⛰️	["Tongariro Alpine Crossing", "Mount Ngauruhoe", "Whakapapa Village"]	[{"link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tongariro National Park Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/adventure", "image": "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tongariro National Park - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	2	2026-06-17 12:49:24.71513+12
c88e1946-f887-488f-a4e8-85d10d75ccfd	6e6c99c9-2086-4456-ac4b-247f8d166271	tauranga	Tauranga	New Zealand	-37.686900	176.165100	🏖️	["Mount Maunganui", "The Elms Mission Station", "Tauranga Art Gallery"]	[{"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tauranga Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/adventure", "image": "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tauranga - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	3	2026-06-17 12:49:24.71513+12
b28b9a3e-3bc9-4903-9ee0-fd387783ca18	6e6c99c9-2086-4456-ac4b-247f8d166271	wellington	Wellington	New Zealand	-41.286500	174.776200	🌧️	["Te Papa Museum", "Wellington Botanical Gardens", "Cuba Street"]	[{"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Wellington Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/adventure", "image": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Wellington - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	4	2026-06-17 12:49:24.71513+12
9af91735-d1c2-4c17-91fd-c7a8d077c1ac	b861bb2e-e5d0-4c74-97c1-3eb7809d3952	auckland	Auckland	New Zealand	-36.848500	174.763300	🌆	["Auckland War Memorial Museum", "Sky Tower", "Waiheke Island"]	[{"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Auckland Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/adventure", "image": "https://images.unsplash.com/photo-1533587851505-d119e13bf0eb?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Auckland - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	0	2026-06-17 15:41:40.682053+12
02edd265-fdc2-40d0-9251-db6e3452c8b0	b861bb2e-e5d0-4c74-97c1-3eb7809d3952	rotorua	Rotorua	New Zealand	-38.136800	176.249700	🌋	["Te Puia", "Rotorua Museum", "Redwoods Treewalk"]	[{"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Rotorua Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/adventure", "image": "https://images.unsplash.com/photo-1506509923831-7b0b30efec98?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Rotorua - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	1	2026-06-17 15:41:40.682053+12
548afe42-ac94-46fc-b619-ed5b4263fe61	b861bb2e-e5d0-4c74-97c1-3eb7809d3952	tongariro-national-park	Tongariro National Park	New Zealand	-39.290800	175.562600	⛰️	["Tongariro Alpine Crossing", "Mount Ngauruhoe", "Whakapapa Village"]	[{"link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tongariro National Park Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/adventure", "image": "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tongariro National Park - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	2	2026-06-17 15:41:40.682053+12
c5910fba-63d6-47f7-9004-010b7fa21f3c	b861bb2e-e5d0-4c74-97c1-3eb7809d3952	tauranga	Tauranga	New Zealand	-37.686900	176.165100	🏖️	["Mount Maunganui", "The Elms Mission Station", "Tauranga Art Gallery"]	[{"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tauranga Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/adventure", "image": "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tauranga - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	3	2026-06-17 15:41:40.682053+12
8a52463b-0dac-4d51-bbbe-bbc3ed998291	b861bb2e-e5d0-4c74-97c1-3eb7809d3952	wellington	Wellington	New Zealand	-41.286500	174.776200	🌧️	["Te Papa Museum", "Wellington Botanical Gardens", "Cuba Street"]	[{"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Wellington Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/adventure", "image": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Wellington - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	4	2026-06-17 15:41:40.682053+12
d30cf6b4-7563-4436-8154-583bf1397c93	c7b5271a-fe62-4089-b6fc-1cf537d8cdcc	auckland	Auckland	New Zealand	-36.848500	174.763300	🌆	["Auckland War Memorial Museum", "Sky Tower", "Waiheke Island"]	[{"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Auckland Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/auckland/activities/adventure", "image": "https://images.unsplash.com/photo-1533587851505-d119e13bf0eb?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Auckland - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	0	2026-06-22 14:59:20.306213+12
a1bbf338-2d73-44df-95a8-a648c42d30ae	c7b5271a-fe62-4089-b6fc-1cf537d8cdcc	rotorua	Rotorua	New Zealand	-38.136800	176.249700	🌋	["Te Puia", "Rotorua Museum", "Redwoods Treewalk"]	[{"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Rotorua Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/rotorua-taupo/activities/adventure", "image": "https://images.unsplash.com/photo-1506509923831-7b0b30efec98?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Rotorua - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	1	2026-06-22 14:59:20.306213+12
4521ab79-dd04-4eb1-be4a-f1b7c027fb02	c7b5271a-fe62-4089-b6fc-1cf537d8cdcc	tongariro-national-park	Tongariro National Park	New Zealand	-39.290800	175.562600	⛰️	["Tongariro Alpine Crossing", "Mount Ngauruhoe", "Whakapapa Village"]	[{"link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tongariro National Park Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tongariro-national-park/activities/adventure", "image": "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tongariro National Park - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	2	2026-06-22 14:59:20.306213+12
a3bff593-00a7-435a-885e-b61399048ebc	c7b5271a-fe62-4089-b6fc-1cf537d8cdcc	tauranga	Tauranga	New Zealand	-37.686900	176.165100	🏖️	["Mount Maunganui", "The Elms Mission Station", "Tauranga Art Gallery"]	[{"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Tauranga Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/tauranga/activities/adventure", "image": "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Tauranga - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	3	2026-06-22 14:59:20.306213+12
9649bbdf-7b3b-4540-a419-8425f5175d8d	c7b5271a-fe62-4089-b6fc-1cf537d8cdcc	wellington	Wellington	New Zealand	-41.286500	174.776200	🌧️	["Te Papa Museum", "Wellington Botanical Gardens", "Cuba Street"]	[{"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Wellington Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/wellington-wairarapa/activities/adventure", "image": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Wellington - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	4	2026-06-22 14:59:20.306213+12
bde61899-2c9c-489a-b8c1-2c59d796b213	c144dee9-6092-4039-a713-c9aa18ff3eda	1	Dubai	United Arab Emirates	25.276987	55.296249	🏙️	["Burj Khalifa", "Dubai Mall", "Dubai Creek", "Jumeirah Beach"]	[{"link": "https://www.bookme.co.nz/things-to-do/dubai/activities/tours/sightseeing-scenic-tours", "image": "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=800&auto=format&fit=crop", "price": "From $49", "title": "Top Rated Dubai Guided Tour", "discount": "45% Off", "originalPrice": "$89"}, {"link": "https://www.bookme.co.nz/things-to-do/dubai/activities/adventure", "image": "https://images.unsplash.com/photo-1533587851505-d119e13bf0eb?q=80&w=800&auto=format&fit=crop", "price": "From $120", "title": "Best of Dubai - Adventure Day", "discount": "20% Off", "originalPrice": "$150"}]	0	2026-07-27 09:45:28.228228+12
2b35178e-ec40-416a-b947-6414f16b183c	28e18650-5dff-44e7-9749-b337b1954991	dubai	Dubai	United Arab Emirates	25.276987	55.296249	🕌	["Burj Khalifa", "Dubai Mall", "Desert Safari", "Dubai Marina"]	[]	0	2026-07-27 13:16:10.065129+12
\.


--
-- Data for Name: logins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.logins (id, user_id, session_token, ip_address, user_agent, issued_at, expires_at, revoked, revoked_at) FROM stdin;
1	368387ce-29cb-4693-af69-a7108ba47982	40454ffeef11feb02800e24be1a80d1099c721c7f87d02bb950920870d457634	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-29 10:31:17.597499+12	2026-05-06 10:31:17.604+12	f	\N
2	368387ce-29cb-4693-af69-a7108ba47982	caeea1ef80e08e1fe18d1754b7ea02c4ba1e8daaa5be4cfc4cbf07573640b8e3	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-29 12:17:17.941765+12	2026-05-06 12:17:17.955+12	f	\N
3	368387ce-29cb-4693-af69-a7108ba47982	316f2d98f0bafd6341de3d04abb718a89f3b710ee26d0894644336b2f772fb17	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-29 12:26:30.494821+12	2026-05-06 12:26:30.506+12	f	\N
4	368387ce-29cb-4693-af69-a7108ba47982	35569037c955b98937cffd3d80af0b7048286da279970f44b14db134e8b6f61a	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-29 16:12:52.776914+12	2026-05-06 16:12:52.804+12	f	\N
5	368387ce-29cb-4693-af69-a7108ba47982	2ea592701f51e38ebf8f5f7ade6b09939bd0457f2369ceedbcee94f77bc85bd5	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-01 16:15:40.366516+12	2026-05-08 16:15:40.376+12	f	\N
6	368387ce-29cb-4693-af69-a7108ba47982	ba76060df070f77d5fae72622546092daae2a406ca1961dc73d623a029ef44e6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-08 10:22:37.844841+12	2026-05-15 10:22:37.864+12	f	\N
7	368387ce-29cb-4693-af69-a7108ba47982	60c6856111090016bf6221e78c0d198f11d9f241bd7b14dc1a4817ea0f7b33c0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-08 10:46:18.028917+12	2026-05-15 10:46:18.035+12	f	\N
8	368387ce-29cb-4693-af69-a7108ba47982	53b09e6a118d85d395a359e01ffa9f1b651bb4033e921f736155439f22ca5385	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-08 10:55:51.619512+12	2026-05-15 10:55:51.623+12	f	\N
9	368387ce-29cb-4693-af69-a7108ba47982	56f30d3bd37f472524565982682ede4a1b9af5ffd92900712cddceeeeae5a0d7	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-08 11:19:22.067448+12	2026-05-15 11:19:22.065+12	f	\N
10	368387ce-29cb-4693-af69-a7108ba47982	ce4fee5d4b9d5a99ca03e56ced6bfa36f48463769f74b2e22125223fc62f1a11	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-08 11:32:01.047436+12	2026-05-15 11:32:01.056+12	f	\N
11	368387ce-29cb-4693-af69-a7108ba47982	55171121de1850e4d57c266a902cea87cf71faaddfa184c1b909565743f8c472	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-08 11:34:47.996628+12	2026-05-15 11:34:48+12	f	\N
12	368387ce-29cb-4693-af69-a7108ba47982	4c1e63eb37d072ad53a7fe0349a9da29aafb202dc09276e3cc9a6ed3a650901e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-08 12:18:07.184006+12	2026-05-15 12:18:07.212+12	f	\N
13	368387ce-29cb-4693-af69-a7108ba47982	65afa18403946abca3b9b700162926f11be11a0afcba2db9ed3f414bfb634b62	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-08 12:20:51.892713+12	2026-05-15 12:20:51.895+12	f	\N
14	368387ce-29cb-4693-af69-a7108ba47982	f97803520c3b3ee6d459fb79bd3364e21789d7ca71b16ddead4f4d296b3a2550	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-08 12:27:53.372426+12	2026-05-15 12:27:53.385+12	f	\N
15	368387ce-29cb-4693-af69-a7108ba47982	69a557686060251468088820a81fc2d79f98c0251f86700a479a4f964b7516fb	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-08 14:16:40.903038+12	2026-05-15 14:16:40.911+12	f	\N
16	368387ce-29cb-4693-af69-a7108ba47982	fcef6c5e3171c71d760fd20c9653e7879f29dce69f4670a0a837dbd3351fe66e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-08 14:23:54.916549+12	2026-05-15 14:23:54.92+12	f	\N
17	368387ce-29cb-4693-af69-a7108ba47982	e6f2b2e12d3ccb74f600df961714c6aecca802d82510f5fcef9303c59a05d346	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-08 15:45:46.622758+12	2026-05-15 15:45:46.649+12	f	\N
18	368387ce-29cb-4693-af69-a7108ba47982	afd75d3fd0df9405f48998562be6eb6e39d01dd6b9c6881e3faa55f821ddfc16	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-08 15:47:48.442672+12	2026-05-15 15:47:48.455+12	f	\N
19	368387ce-29cb-4693-af69-a7108ba47982	9b71793f959d9525f5101ee50b11c3ff47248e43e3dd8bc7b7dc63a2552b6e78	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-08 16:08:59.058243+12	2026-05-15 16:08:59.065+12	f	\N
20	368387ce-29cb-4693-af69-a7108ba47982	7ad3590f2fc1c9c1045644b564bac21b7e2096d8ea75885213639c9e53b1bc70	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-08 16:12:49.994196+12	2026-05-15 16:12:49.995+12	f	\N
21	368387ce-29cb-4693-af69-a7108ba47982	679b2e7ff4314ee33d8ab14bb28a4a3a97fa1e181b5df12ae96fc2baef9a5b4e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-08 16:39:06.445302+12	2026-05-15 16:39:06.442+12	f	\N
22	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	2c8f606191e2eee74c9fe3372fed3c023c1c56c98ae2a832cd9cca0658d3d15b	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-15 08:47:43.681355+12	2026-05-22 08:47:43.716+12	f	\N
23	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	b35ed4c309ca923dbbbb726901acc4e99b7dc35847538a0fd6ca98a977d4fb6a	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-15 08:50:18.627091+12	2026-05-22 08:50:18.647+12	f	\N
24	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	9133a37f1255b6beeebcc1a2aa1b4af00cbe46f043f09bc746a7d8b3eae6c4d5	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-15 09:12:59.724505+12	2026-05-22 09:12:59.795+12	f	\N
25	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	d9a628515529978eefefb1f65bd6915798a3a09ec3116478f8d7c02a6ba6fccf	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-15 09:17:37.994945+12	2026-05-22 09:17:38.01+12	f	\N
26	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	7e8511939b0f9987a38544d788e77168fcd4831b1d4ee6064b87cf6b5873f9f2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-15 11:35:04.163751+12	2026-05-22 11:35:04.212+12	f	\N
27	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	4121672ccf1b5e0077af0e757b57e2d1de1d0e3a4e1619e51a1996ca8e603fa4	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.119.0 Chrome/142.0.7444.265 Electron/39.8.8 Safari/537.36	2026-05-15 12:42:32.928691+12	2026-05-22 12:42:32.957+12	f	\N
28	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	db07f43907eebc42a354fccad35f3f7a5da8b1e4f57b493b0148b7ec69071829	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-15 12:52:15.188107+12	2026-05-22 12:52:15.235+12	f	\N
29	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	3d1f729ba1875a39bc438a860f875e3b0a6ce92b79249f82c314f7d496a5e35c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-15 13:46:44.796815+12	2026-05-22 13:46:44.849+12	f	\N
30	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	3ce07ab3ccf7641828e26230f6e11db2c39247656bccd421fd1f7ee37e87b9ba	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-15 14:11:55.981958+12	2026-05-22 14:11:56.081+12	f	\N
31	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	5ce1013b187f24950cd42d4dc4dd77d6114e22d02481d5c8206c608a95b55d7b	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.120.0 Chrome/142.0.7444.265 Electron/39.8.8 Safari/537.36	2026-05-15 16:21:38.792003+12	2026-05-22 16:21:38.826+12	f	\N
32	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	358d9b63a795b06c5ec224a01a409e8bdd566d91383f0efed728d3a62d016eb7	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-19 15:00:01.104997+12	2026-05-26 15:00:01.123+12	f	\N
33	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	797083247bce3d723bd2f8122f696a26494a7d84307db56f913aabe1323a4622	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-19 15:17:01.756729+12	2026-05-26 15:17:01.773+12	f	\N
34	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	c85f0b6cea3528f13d8adb21155533c612e8678b2e7bc4e8905e41c19df1d101	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-19 15:43:44.38508+12	2026-05-26 15:43:44.403+12	f	\N
35	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	9bca3cc557f5a8eff024f1f74d66bce1e49844d25b9064b54f02948eae64c9c5	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-19 23:51:24.072934+12	2026-05-26 23:51:24.116+12	f	\N
36	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	e4b9754633df0349fe19e89521406908e302b62cdd956f51ad208f91adeb9579	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-19 23:57:44.125135+12	2026-05-26 23:57:44.145+12	f	\N
37	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	48c4a94d2fc88a5862c9299fe2c8c273bfbb604285026da83b96c68e2f42da24	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-20 00:09:47.547719+12	2026-05-27 00:09:47.641+12	f	\N
38	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	50fd33c189a32b93f16e89bfea7f6a22fcd95a270434ba015829a58fdd6512a4	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-20 00:31:05.936382+12	2026-05-27 00:31:05.973+12	f	\N
39	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	7173159b9e7df74c7e422407deb0af628ed6c294d51df999a3b9f3347d89a15a	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-20 01:05:25.921159+12	2026-05-27 01:05:25.976+12	f	\N
40	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	bf5b8e2588d88498aff760755df3ae65c751effa8d87c5f9bdeb491debe85330	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-20 10:20:26.022858+12	2026-05-27 10:20:26.101+12	f	\N
41	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	c39548670d1f5fdaf21ab06446ef63bced0557da596f565763a3fba111dc3c94	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-20 11:52:27.394384+12	2026-05-27 11:52:27.436+12	f	\N
42	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	e8733b475badf9c2447e49a2f73cb285e00a4184b117e73dde92dce61289cbc2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-20 12:11:52.579677+12	2026-05-27 12:11:52.668+12	f	\N
43	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	19437220834aeedd37699c20629491440e0ac2af97c839d1b7ea288daf7bdb40	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-20 12:46:29.295802+12	2026-05-27 12:46:29.345+12	f	\N
44	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	075fb433c7fd5c15acf1e50da388a31ec11e49e05b9176627a73cd84398351b9	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-20 15:29:24.564036+12	2026-05-27 15:29:24.603+12	f	\N
45	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	accf754b2a3466c99f95f0c02e2d27cc30247aad73c2a4d8111ba431086a089b	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-20 15:31:37.948996+12	2026-05-27 15:31:37.961+12	f	\N
46	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	128ef65d0996ee8086b24f3930e9405159f7bedd7f558c46b9652a1cfabaaa37	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-22 12:13:52.436077+12	2026-05-29 12:13:52.509+12	f	\N
47	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	61e676daecc0672d7c0994e8e0738aa432068736e2d1020d9d9d430a3f6a6f4e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-22 12:35:36.295928+12	2026-05-29 12:35:36.319+12	f	\N
48	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	ceb4d58b72fad0888eb38622e807f85334ad8d1f31ee982bdc2bb4092aea265e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-22 14:38:24.280895+12	2026-05-29 14:38:24.291+12	f	\N
49	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	02985c6a086c2eab87af1e39f38b6e5b3008bc5bbc8478f2ca7259f95532ff50	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-22 14:38:43.4062+12	2026-05-29 14:38:43.425+12	f	\N
50	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	360fe29833b2d622126c6f1051fa697ede678bcac5324604a5ef7cb46f36eb4f	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-22 14:39:24.84944+12	2026-05-29 14:39:24.844+12	f	\N
51	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	314dac0b17c764ee2641c6851c4e033633cf2b83dde0ce0011274bb99cf85496	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-25 13:43:46.137309+12	2026-06-01 13:43:46.162+12	f	\N
52	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	b66d5edaedb8ab8a69508e9879c54509c715a9d9df9adefdbc7ebcda8486d09b	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-25 14:00:38.842151+12	2026-06-01 14:00:38.857+12	f	\N
53	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	97abe03e94d5a1d388a0a08f967642f5e2b82b679542a33ca56b51aaad734036	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-25 15:24:23.251197+12	2026-06-01 15:24:23.263+12	f	\N
54	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	47f5017185d2b8b16c1f92c5f785e41aa1163404018e2177d71ddb2ea18beaba	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-26 20:00:57.624776+12	2026-06-02 20:00:57.646+12	f	\N
55	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	4f3cbf3dd4620c21c0219380be211277b367e36de6238431fcc8a59f00d94795	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-27 12:42:59.317332+12	2026-06-03 12:42:59.374+12	f	\N
56	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	0e58c25e7d4d3ca91cbbbb17ccf92d9154523ce7c9a4a3e8f3688d0675d76c66	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-27 12:45:30.103028+12	2026-06-03 12:45:30.112+12	f	\N
57	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	1f46c756787b0b1d05fbc0db77b4bdb226173b1a3e90abeae98be046cbf77a20	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-27 14:42:11.156186+12	2026-06-03 14:42:11.203+12	f	\N
58	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	7343c261cf277f5014bf623cc05fb380220291af1f1357f6a98dfc84c0e1e490	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-27 15:00:24.984132+12	2026-06-03 15:00:25.006+12	f	\N
59	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	a60d68b944e5ca1718e9799f9a307289e26171dfb94675b8dbd0f89b962fef28	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0	2026-05-27 15:17:19.255941+12	2026-06-03 15:17:19.271+12	f	\N
60	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	ab73477918b303e82635cf24f6cbbc782443078cc94ac3e1d2902fe171f15a2d	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-08 12:48:30.080221+12	2026-06-15 12:48:30.142+12	f	\N
61	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	a30d3c4c4d904bd8eefc91170dfadce1ac4e6869516bbd348c13b51e0b55add0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-08 15:04:08.580372+12	2026-06-15 15:04:08.629+12	f	\N
62	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	07c223645fb330059977a529b8c2478167cab7018979b5c1eba071cb1914957c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-08 15:36:38.35906+12	2026-06-15 15:36:38.411+12	f	\N
63	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	d05a021de2c04b7af9c0db20097de773840d915c55aa0a661c85b16cb493f668	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-17 12:23:39.941665+12	2026-06-24 12:23:40.093+12	f	\N
64	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	21e0cf3f8b00317d80902eb60c3b64c3f9a8b57c7f19071b324204db22aad895	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-17 12:40:00.252435+12	2026-06-24 12:40:00.263+12	f	\N
65	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	b6f028da03014dbab3aecd1c75e8cbc2fdb833503bfbac1aece4478352e62b72	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-17 12:46:17.61444+12	2026-06-24 12:46:17.626+12	f	\N
66	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	8f184a6930a006260e38ca42f3cb8b1459293eebe49df966acbf9b4d3f3ea75e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-17 12:48:56.232892+12	2026-06-24 12:48:56.255+12	f	\N
67	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	67bf994ec474a2692e20aeca9e4dba2007503d95c1a25a94f050d462c0969a89	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-17 13:12:02.627021+12	2026-06-24 13:12:02.683+12	f	\N
68	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	b26eda672bbc564ce458d903d5895a9082337eedc511d4713bf0c8cd78acad9b	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-17 13:18:50.905102+12	2026-06-24 13:18:50.91+12	f	\N
69	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	b271a351d6e9787398113f0bb6ad26062d2375152993a1763aff473c2581f786	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-17 13:41:50.013179+12	2026-06-24 13:41:50.025+12	f	\N
70	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	e52784cd2a8f411d660155a09fc4d41a4892dfa8b8988cdbb827aa75d9a461a6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-17 13:48:25.873931+12	2026-06-24 13:48:25.897+12	f	\N
71	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	377f93327609dd2548946cf4cd87b36f7349f839b95e9b71609650a86c7ba7a9	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-17 14:02:23.463154+12	2026-06-24 14:02:23.48+12	f	\N
72	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	11255e331b603865ab04b956094c010463c10b65327a5ebfda31f8f7d4b63714	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-17 14:06:34.213892+12	2026-06-24 14:06:34.229+12	f	\N
73	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	13562a632a98d630bdc37285ecd939040556a94905ba298487f276ec74ae1d2f	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-17 15:39:49.876565+12	2026-06-24 15:39:49.892+12	f	\N
74	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	e1475408119066c933ebfa1423bc646109e4eac737100f3887dd2d6487039f19	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-17 15:41:19.602381+12	2026-06-24 15:41:19.612+12	f	\N
75	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	7d224daa552c3dbd8f6a6810ddb83283e4111006879159a2867604dedcf5fa54	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-17 15:56:44.162245+12	2026-06-24 15:56:44.181+12	f	\N
76	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	54e505faaabc54d00d76de42adbe2b723817bcc17d1a9ecde57a680a01ca19b1	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-17 16:15:32.638253+12	2026-06-24 16:15:32.651+12	f	\N
77	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	dc2af85f119442f0b244249afdfab0ff6e1d206a4447f9dc4a27b2480ff7c88c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-17 16:54:31.882656+12	2026-06-24 16:54:31.905+12	f	\N
78	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	55b729162ab8124f92a04f6e0abdf5cca365e6c0b07174a17e27ebf8a49c4dba	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-17 16:56:26.807208+12	2026-06-24 16:56:26.816+12	f	\N
79	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	a04fbf2033466e5788549931f24b0c7d1221bf04cdcb3139783fe08d7e5b927f	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-21 19:19:24.085912+12	2026-06-28 19:19:24.115+12	f	\N
80	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	92acabc18b2dea6c61030b1cd3dbcb613784446da64dc49c6a05c9794ce20c4d	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15	2026-06-22 14:56:04.243796+12	2026-06-29 14:56:04.289+12	f	\N
81	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	292a9cb0e599af9ccfccb1c5f49438733dc26724d1885c213cba72e140eb1720	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15	2026-06-22 15:15:26.995153+12	2026-06-29 15:15:27.006+12	f	\N
82	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	1403e83c176a0dfda931960ed2f9fab1a2a8d7ddfc9d647a1869bec53c5e3523	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-29 13:06:00.107415+12	2026-07-06 13:06:00.227+12	f	\N
83	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	0383231a04d34f1a6e6947877065f38ec2aa17a94e5dfd3917203ffc93e5b4e8	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-29 14:01:56.323402+12	2026-07-06 14:01:56.375+12	f	\N
84	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	9a2b86a9a240367c17346207828a99c4e4a91873603db59137743ff63015cd61	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-07-01 14:43:46.872082+12	2026-07-08 14:43:46.921+12	f	\N
85	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	095e946e438c5c91db45eb7b10765b1d4a122bd2663d0381d0fb5f29291d6845	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-07-01 15:22:01.115685+12	2026-07-08 15:22:01.159+12	f	\N
86	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	cf0c158ecb3e8ebcb88b1f20573e5ad08a023e2a0444910eec721781d7904142	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-07-07 19:37:08.416596+12	2026-07-14 19:37:08.496+12	f	\N
87	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	7563b20c0936aa19554b49ed686a3819dff3cb596a97056b324df93cc0d6afd5	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-07-07 19:52:42.288351+12	2026-07-14 19:52:42.304+12	f	\N
88	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	6345e15002bcbb7fe3397c2605e4ff8df7090baf49affa574e5cd6288db7c42a	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-07-07 21:26:44.023991+12	2026-07-14 21:26:44.033+12	f	\N
89	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	0a0758731ac502b2ce62b1404cda7bd6999f933ee1e2bef967928fdf59b05100	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-07-08 11:51:03.892321+12	2026-07-15 11:51:03.929+12	f	\N
90	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	1b66e85be7562e2005dd135c27684894486a80e3e75bc26fbac7150e43df3273	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-08 11:58:53.616234+12	2026-07-15 11:58:53.622+12	f	\N
91	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	c4a708becd0904a2c38182098bd08ed3691e17dcc8495721afe02ad9a53fb281	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-13 12:16:34.220295+12	2026-07-20 12:16:34.249+12	f	\N
92	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	2bd0690643a87b574934260dca22b3192c802f70e0d19f69ecd2b5c75dfe76a9	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-13 13:16:53.931533+12	2026-07-20 13:16:53.955+12	f	\N
93	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	ee1eafa8764b665ba728b2b9f2c9dfd748a22baa3f5b0a75bc312186af7da258	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-13 15:11:33.010066+12	2026-07-20 15:11:33.048+12	f	\N
94	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	7a04f5f8968de5938993d8669aee6e95f10181c2ac9253e0641d788c715efb66	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-14 11:43:28.10813+12	2026-07-21 11:43:28.162+12	f	\N
95	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	2ad413e2dfa47c527bec26d3f54f96b1b410672173c4ec89a050e7c8c162f1d3	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-14 12:03:07.2749+12	2026-07-21 12:03:07.279+12	f	\N
96	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	ca9e72310c090d3e2f4e4bcd58ad851c8377421d1c6f673be68d09757976d40b	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-14 12:33:37.895916+12	2026-07-21 12:33:37.902+12	f	\N
97	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	51a68949dfa9d7f38de6d351219ed8ed3ac05172df4f711d307e0c2538ed50f3	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-14 12:50:59.417438+12	2026-07-21 12:50:59.425+12	f	\N
98	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	53a507856e2670043b64834fa802dd9ba7acad0c8865c3ffa66f8586faa1c4bb	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-15 16:23:27.967448+12	2026-07-22 16:23:27.988+12	f	\N
99	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	abebb40664927cbe3f554c1587bae5964b47c3474394666a91a8b60fd592bbc0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-15 16:41:13.845325+12	2026-07-22 16:41:13.88+12	f	\N
100	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	8666eddd8146f6ce9878c67dc5b801b9804afb5ac404c955dead6305926fc67d	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-15 16:50:26.588992+12	2026-07-22 16:50:26.592+12	f	\N
101	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	06fbda3c18d0e0c259f792d956bcfa92ed711aaa69ea05246d244d5c2bc8c66d	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-20 12:46:09.894341+12	2026-07-27 12:46:09.946+12	f	\N
102	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	78b3a4a8d2588e36b37000ed6d95bacad854ac17ccf9c7a509d1f1498a430aa8	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 13:01:04.917907+12	2026-07-27 13:01:04.953+12	f	\N
103	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	42772bf3594a75051b5c850f594e3af1402fb24cf51b14db5503c5734a6de17e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 14:12:53.683127+12	2026-07-27 14:12:53.702+12	f	\N
104	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	219bc85dde42344ef8d58188dde2f64ef516b788f3b5cff4f22b79dc01e69748	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 14:28:34.046338+12	2026-07-27 14:28:34.074+12	f	\N
105	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	1c94b41384b4c1c92c4594970ff9ee07149748ba8b8d8239dd7493962d8b93c9	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 14:31:00.063301+12	2026-07-27 14:31:00.08+12	f	\N
106	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	667a5214a72ee4b7b6a0f0814148b61433e1a07fc83c3f615d7039373bf8a0dc	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 14:33:34.089044+12	2026-07-27 14:33:34.117+12	f	\N
107	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	be2d1c88224f6cfffa362b31b26a1858b1a12f04867e6e363b149837e108a9a1	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 14:37:03.518553+12	2026-07-27 14:37:03.523+12	f	\N
108	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	d4dbd17dc3d37b145a2162e25743d21c48813925bdb45f1814badb09d52f6dee	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-20 14:38:09.628155+12	2026-07-27 14:38:09.631+12	f	\N
109	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	65a355793c106175dc4b15d5831eeb2cc59c0a07d7ac4d74d083645408e853c8	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 14:39:23.41022+12	2026-07-27 14:39:23.467+12	f	\N
110	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	9135d2bc33b7dc87681032fa7f1a6475ba452c384ae781171ab3a8d2cacd28f2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 14:41:57.53459+12	2026-07-27 14:41:57.548+12	f	\N
111	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	11c1e8d2f37d8a905db61c46a75dc260b3a243f868c08b982ae76b1c19d587ca	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-20 14:57:08.180229+12	2026-07-27 14:57:08.2+12	f	\N
112	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	d45c12b71dda029ccc9bd34ed835289febdd9f1da6bc10f9239b95d1fd454a5c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-20 15:37:10.620133+12	2026-07-27 15:37:10.637+12	f	\N
113	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	aad7685b55a6a17d4439a308a7e7b2f9f9094a4b118456bef59e2d91bc7d3fb0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-20 15:57:12.361147+12	2026-07-27 15:57:12.369+12	f	\N
114	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	32f2586171dd261dd0d0e705239d8e29c286435b938b163fa66bc80af1b148de	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 12:15:28.063926+12	2026-07-28 12:15:28.116+12	f	\N
115	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	bd750d6e1a0a7103ab1dc8d8da3b26e9ec35355814b8e000e6a762566b614dc6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 12:43:32.43522+12	2026-07-28 12:43:32.441+12	f	\N
116	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	d9a1a31ed2699383c01aedca60eec413882c6f1478422bfa7139ab29e32c3e44	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 12:49:14.591709+12	2026-07-28 12:49:14.593+12	f	\N
117	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	6a56a96ba12bd17527774f2737d961fbc650643eb0172e40b2cb2f64d24aad61	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 15:29:51.045649+12	2026-07-28 15:29:51.066+12	f	\N
118	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	0b8401dedb208f356e24a8875bf9dc3fc30cc10bc27228dd988c488c480a138b	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 15:46:46.915787+12	2026-07-28 15:46:46.937+12	f	\N
119	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	6e4ae8fc9a4a71c260897242b7fdea26f40ac2c41659a06b10b4d6f2856aa219	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 15:57:25.843682+12	2026-07-28 15:57:25.872+12	f	\N
120	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	247355adbe1c84ba0eeec9eb28b1a3614b705bc367fdd141d932092a8fda674f	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 15:58:35.109596+12	2026-07-28 15:58:35.118+12	f	\N
121	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	dbafddaee03b7179fc5416d52da4920419d0dedc6571791c2f25aca4807e510d	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 16:24:00.223023+12	2026-07-28 16:24:00.234+12	f	\N
122	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	73180fc7124ea547eb8df516f49b77f5d442248c76246074c1adb8c9daba225c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-21 16:32:41.439425+12	2026-07-28 16:32:41.453+12	f	\N
123	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	e82a494bb7c23ccc739cf5bd60d780f29a990346b79f895890ae3997c6b61b6d	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 15:54:06.926135+12	2026-07-30 15:54:06.986+12	f	\N
124	48339ec4-c251-4476-8b7c-9aa45d59f9d4	9d5d23088c471b02cd02bf5a9182ee3b493d49563a4c7c6c8e22b27579f03c41	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 16:19:08.611807+12	2026-07-30 16:19:08.614+12	f	\N
125	48339ec4-c251-4476-8b7c-9aa45d59f9d4	6301cb76f7af00926cc8b7a309458792c5f742a485453e925bb380cdb8def173	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 16:24:51.086574+12	2026-07-30 16:24:51.091+12	f	\N
126	48339ec4-c251-4476-8b7c-9aa45d59f9d4	be83b730f269ed2d6b19ae0825339d2343da593af455ddc9649ca0659b2b3c9b	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 16:34:26.497899+12	2026-07-30 16:34:26.499+12	f	\N
127	48339ec4-c251-4476-8b7c-9aa45d59f9d4	24e80c3bb7dbc064a22b499bc88825234a49f38cad332ca97da7b0220abcc75c	::1	\N	2026-07-23 16:35:48.170863+12	2026-07-30 16:35:48.175+12	f	\N
128	48339ec4-c251-4476-8b7c-9aa45d59f9d4	9e535a0e78b14962792b83426bdeec6fff4e64e2e2effb1cbb4a9e498fb5c088	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 16:37:13.465328+12	2026-07-30 16:37:13.469+12	f	\N
129	48339ec4-c251-4476-8b7c-9aa45d59f9d4	f62449964a37583a00a485ba031108d91db0e22d0f976b1b836977fb24ce60cb	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 16:59:08.491691+12	2026-07-30 16:59:08.5+12	f	\N
130	21d0a265-7c5e-4d82-b6cb-417edc7f7c28	eaeee6ec2f0f32807eabdf1077846fbce3357ac84a031622534df5bd6a8c6f36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 17:03:43.968741+12	2026-07-30 17:03:43.965+12	f	\N
131	21d0a265-7c5e-4d82-b6cb-417edc7f7c28	73077c72b9c60fe77f1f8f9dfa4e8a86b466b048d32122f1922d318d60a98fa1	::1	\N	2026-07-23 17:11:09.388546+12	2026-07-30 17:11:09.392+12	f	\N
132	48339ec4-c251-4476-8b7c-9aa45d59f9d4	8763606fbe26c6d7096d8a648a583a7bbb0b803abd07b346f2583143703af471	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-23 17:12:50.724338+12	2026-07-30 17:12:50.735+12	f	\N
133	48339ec4-c251-4476-8b7c-9aa45d59f9d4	28d8cd13373132103c89c3c4a0356b435865883b76db6009d514270f7d2ed123	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-25 08:32:53.184208+12	2026-08-01 08:32:53.194+12	f	\N
134	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	e8c507d97bd9fdcb64d9d76fbd7b558c6996462de0d721cbec2917b6da43f50c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-25 10:10:35.175582+12	2026-08-01 10:10:35.206+12	f	\N
135	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	820c5f14a673305a693d3de9ea30b9ea48807c2ad7b115d9e664ae5ba0b9a2fb	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-25 10:37:00.185066+12	2026-08-01 10:37:00.203+12	f	\N
136	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	9f7c0dda9288e1e37d844ad1517a0af0e24c3b52fa7c12665e578629cf82b80e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-25 12:09:27.547099+12	2026-08-01 12:09:27.572+12	f	\N
137	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	7f28af18dfd5e23dcfd60bef364798710a5d7d6db0358d65e8525799f5f3cde2	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-27 09:28:07.948665+12	2026-08-03 09:28:07.994+12	f	\N
138	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	34f3c922218824309457a586b52a58d9dc791a0a9411e8c68d8b4e1199c3b9d1	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-27 09:45:02.807061+12	2026-08-03 09:45:02.832+12	f	\N
139	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	770b65d7387de2b676c06b5aad86e95371cc6096b0cf69e49bd9504951916e8f	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-27 10:01:06.603458+12	2026-08-03 10:01:06.66+12	f	\N
140	48339ec4-c251-4476-8b7c-9aa45d59f9d4	b06caeaf1948451e0db65828c8d340131c5b3ac82e96b9e9aaa8b946b259313c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-27 10:04:07.400651+12	2026-08-03 10:04:07.4+12	f	\N
141	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	49dea27eed0a776f90637ddc415e19947212ae03b5978446533b080503dd57c6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-27 11:14:20.934944+12	2026-08-03 11:14:20.951+12	f	\N
142	48339ec4-c251-4476-8b7c-9aa45d59f9d4	6913ba5eecea5c8f34554557a02c5ad5805d2421b2903b76ecc2ebb106086d09	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-27 11:14:39.328883+12	2026-08-03 11:14:39.322+12	f	\N
143	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	65b50485bd669584ac78c45758ce0812a7613c149660d75d049892d94afa17f6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-27 12:08:06.402151+12	2026-08-03 12:08:06.499+12	f	\N
144	4c8663a6-7539-48e1-afb6-9033d460503e	4403a03b5b12a37831b6a12f8476e75d9ee6435eff0237f10e95c721eca7a929	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-27 12:15:09.293067+12	2026-08-03 12:15:09.289+12	f	\N
145	4c8663a6-7539-48e1-afb6-9033d460503e	1085d7be2c0487cd8c863168720a762c908faa8d51dca7a6712fd4ee370ae1d9	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-27 12:19:02.105778+12	2026-08-03 12:19:02.112+12	f	\N
146	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	2df06382e9b4c6cf28670335c8c956d40c7cc84779bd64a507104b1b519e65d8	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-27 12:20:17.049212+12	2026-08-03 12:20:17.09+12	f	\N
147	48339ec4-c251-4476-8b7c-9aa45d59f9d4	b2a496b5fd636f09e6568f183b5f421c6dda1c718654878babda83149b5d400c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-27 12:21:09.177075+12	2026-08-03 12:21:09.18+12	f	\N
148	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	b71098edf244bf9b8c33e97cbabe25a8cfeeadd0046f4698053b1714e1481d60	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-27 12:23:16.887958+12	2026-08-03 12:23:16.906+12	f	\N
149	48339ec4-c251-4476-8b7c-9aa45d59f9d4	e849e26a01988317494bdac1e9dadb7c45e771fd526f7ae6601ac1f077c97b56	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-27 12:49:48.604689+12	2026-08-03 12:49:48.624+12	f	\N
150	48339ec4-c251-4476-8b7c-9aa45d59f9d4	28568d1725162f79b604c8ea32add1c78b3345d82808727536bde20a7a515f2b	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-27 12:58:04.300666+12	2026-08-03 12:58:04.31+12	f	\N
151	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	f2569066bb4fd4a615557e74111191f4a694dc1c1596cb65631ed242a287f928	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-27 12:58:18.354413+12	2026-08-03 12:58:18.361+12	f	\N
152	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	41805a108ddbdfe3d2614017da84b825697ea608afd82ed905e850f74730563d	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-27 13:01:00.375137+12	2026-08-03 13:01:00.398+12	f	\N
153	48339ec4-c251-4476-8b7c-9aa45d59f9d4	45710e0ba050310a9a181f5b397c7a2a0e39039dfa86377492dbf304171516a7	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-27 13:05:37.443185+12	2026-08-03 13:05:37.458+12	f	\N
154	4c8663a6-7539-48e1-afb6-9033d460503e	611d645c7ebe52c6de515961b6462c5fd0718f0fb3728a2416df2df39d4b2163	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-27 13:08:38.065032+12	2026-08-03 13:08:38.068+12	f	\N
155	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	04eeb57fa10a732184368a22690079046c3bff20a7fabb55c8af91c85c1c5cc0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-27 13:14:48.720115+12	2026-08-03 13:14:48.786+12	f	\N
156	4c8663a6-7539-48e1-afb6-9033d460503e	4f7f1738e7db2ba9bdacde5d69a0196ca8d905b69103dee41e8e1afab7f2af8f	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-27 13:26:42.916156+12	2026-08-03 13:26:42.926+12	f	\N
157	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	c52af53347a5831d8491ce4606b4acdb8354b34d99d0082d04ae523d0764afcf	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-27 14:16:34.264615+12	2026-08-03 14:16:34.296+12	f	\N
\.


--
-- Data for Name: password_resets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_resets (id, user_id, token_hash, expires_at, used, created_at) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schema_migrations (id, filename, applied_at) FROM stdin;
1	001_create_enums.sql	2026-05-22 14:33:21.438918+12
2	002_create_users.sql	2026-05-22 14:33:21.50589+12
3	003_create_user_profiles.sql	2026-05-22 14:33:21.511508+12
4	004_create_user_preferences.sql	2026-05-22 14:33:21.516321+12
5	005_create_audit_logs.sql	2026-05-22 14:33:21.51927+12
6	006_create_logins.sql	2026-05-22 14:33:21.521103+12
7	007_create_password_resets.sql	2026-05-22 14:33:21.523453+12
8	008_create_trips.sql	2026-05-25 11:47:31.640393+12
10	0011_alterTrips.sql	2026-06-17 12:48:30.694793+12
11	009_trips_modifications.sql	2026-06-17 12:48:30.697283+12
12	010_create_chat_sessions.sql	2026-07-01 16:37:59.954562+12
13	0010_agent_packages.sql	2026-07-15 17:48:55.689533+12
14	0012_alterTrips.sql	2026-07-23 16:23:41.402674+12
15	014_add_specialties_to_user_profiles.sql	2026-07-23 16:23:41.409884+12
\.


--
-- Data for Name: trips; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trips (id, user_id, title, summary, start_city, travelers, days, budget_level, suggestions, status, created_at, updated_at, selected_components, total_price_per_person, total_price_all, selected_package_ids, is_modified, version) FROM stdin;
93d2697a-a1f5-4da2-8067-46b27bf61a68	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	Auckland Trip	Get ready to explore the breathtaking landscapes of Kiwi Land (New Zealand) on a budget-friendly adventure. We'll start our journey in Auckland, experiencing its vibrant culture, before heading to the geothermal wonders of Rotorua. Then, it's off to the stunning natural beauty of Tongariro National Park and the relaxing beaches of Tauranga. Finally, we'll wrap up with a visit to the artistic and cultural hub of Wellington.	Auckland	1	7	budget	[{"id": "queenstown", "name": "Queenstown", "emoji": "🏞️", "country": "New Zealand"}, {"id": "christchurch", "name": "Christchurch", "emoji": "🌿", "country": "New Zealand"}, {"id": "dunedin", "name": "Dunedin", "emoji": "🏰", "country": "New Zealand"}]	saved	2026-05-25 13:44:05.296218+12	2026-05-25 13:44:05.296218+12	[]	0.00	0.00	[]	f	1
dd2e6cb6-1feb-4b1f-b08a-c87c15a464c4	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	Auckland Trip	Get ready to explore the breathtaking landscapes of Kiwi Land (New Zealand) on a budget-friendly adventure. We'll start our journey in Auckland, experiencing its vibrant culture, before heading to the geothermal wonders of Rotorua. Then, it's off to the stunning natural beauty of Tongariro National Park and the relaxing beaches of Tauranga. Finally, we'll wrap up with a visit to the artistic and cultural hub of Wellington.	Auckland	1	7	budget	[{"id": "queenstown", "name": "Queenstown", "emoji": "🏞️", "country": "New Zealand"}, {"id": "christchurch", "name": "Christchurch", "emoji": "🌿", "country": "New Zealand"}, {"id": "dunedin", "name": "Dunedin", "emoji": "🏰", "country": "New Zealand"}]	saved	2026-05-25 14:00:47.701488+12	2026-05-25 14:00:47.701488+12	[]	0.00	0.00	[]	f	1
7bec2c91-66ac-4034-8adf-9f29c195e8dc	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	Auckland Trip	Get ready to explore the breathtaking landscapes of Kiwi Land (New Zealand) on a budget-friendly adventure. We'll start our journey in Auckland, experiencing its vibrant culture, before heading to the geothermal wonders of Rotorua. Then, it's off to the stunning natural beauty of Tongariro National Park and the relaxing beaches of Tauranga. Finally, we'll wrap up with a visit to the artistic and cultural hub of Wellington.	Auckland	1	7	budget	[{"id": "queenstown", "name": "Queenstown", "emoji": "🏞️", "country": "New Zealand"}, {"id": "christchurch", "name": "Christchurch", "emoji": "🌿", "country": "New Zealand"}, {"id": "dunedin", "name": "Dunedin", "emoji": "🏰", "country": "New Zealand"}]	saved	2026-05-25 14:01:49.777647+12	2026-05-25 14:01:49.777647+12	[]	0.00	0.00	[]	f	1
29e1f118-916a-4ead-bbfa-3c55aeda2d8a	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	Europe	Get ready to explore the breathtaking landscapes of Kiwi Land (New Zealand) on a budget-friendly adventure. We'll start our journey in Auckland, experiencing its vibrant culture, before heading to the geothermal wonders of Rotorua. Then, it's off to the stunning natural beauty of Tongariro National Park and the relaxing beaches of Tauranga. Finally, we'll wrap up with a visit to the artistic and cultural hub of Wellington.	Auckland	1	7	budget	[{"id": "queenstown", "name": "Queenstown", "emoji": "🏞️", "country": "New Zealand"}, {"id": "christchurch", "name": "Christchurch", "emoji": "🌿", "country": "New Zealand"}, {"id": "dunedin", "name": "Dunedin", "emoji": "🏰", "country": "New Zealand"}]	saved	2026-05-25 14:03:03.921799+12	2026-05-25 14:03:03.921799+12	[]	0.00	0.00	[]	f	1
8e246c0f-aa10-4021-a509-7e80f06012b4	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	Auckland Trip	Get ready to explore the breathtaking landscapes of Kiwi Land (New Zealand) on a budget-friendly adventure. We'll start our journey in Auckland, experiencing its vibrant culture, before heading to the geothermal wonders of Rotorua. Then, it's off to the stunning natural beauty of Tongariro National Park and the relaxing beaches of Tauranga. Finally, we'll wrap up with a visit to the artistic and cultural hub of Wellington.	Auckland	1	7	budget	[{"id": "queenstown", "name": "Queenstown", "emoji": "🏞️", "country": "New Zealand"}, {"id": "christchurch", "name": "Christchurch", "emoji": "🌿", "country": "New Zealand"}, {"id": "dunedin", "name": "Dunedin", "emoji": "🏰", "country": "New Zealand"}]	saved	2026-05-25 15:24:36.201956+12	2026-05-25 15:24:36.201956+12	[]	0.00	0.00	[]	f	1
80a06a6d-001e-49a1-bcb3-628d013a5a79	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	Wellington	Get ready to explore the breathtaking landscapes of Kiwi Land (New Zealand) on a budget-friendly adventure. We'll start our journey in Auckland, experiencing its vibrant culture, before heading to the geothermal wonders of Rotorua. Then, it's off to the stunning natural beauty of Tongariro National Park and the relaxing beaches of Tauranga. Finally, we'll wrap up with a visit to the artistic and cultural hub of Wellington.	Auckland	1	7	budget	[{"id": "queenstown", "name": "Queenstown", "emoji": "🏞️", "country": "New Zealand"}, {"id": "christchurch", "name": "Christchurch", "emoji": "🌿", "country": "New Zealand"}, {"id": "dunedin", "name": "Dunedin", "emoji": "🏰", "country": "New Zealand"}]	saved	2026-05-25 15:28:07.543127+12	2026-05-25 15:28:07.543127+12	[]	0.00	0.00	[]	f	1
24047103-5e48-44b4-a280-28f166aa2669	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	Auckland Trip	Get ready to explore the breathtaking landscapes of Kiwi Land (New Zealand) on a budget-friendly adventure. We'll start our journey in Auckland, experiencing its vibrant culture, before heading to the geothermal wonders of Rotorua. Then, it's off to the stunning natural beauty of Tongariro National Park and the relaxing beaches of Tauranga. Finally, we'll wrap up with a visit to the artistic and cultural hub of Wellington.	Auckland	1	7	budget	[{"id": "queenstown", "name": "Queenstown", "emoji": "🏞️", "country": "New Zealand"}, {"id": "christchurch", "name": "Christchurch", "emoji": "🌿", "country": "New Zealand"}, {"id": "dunedin", "name": "Dunedin", "emoji": "🏰", "country": "New Zealand"}]	saved	2026-05-25 15:29:50.361853+12	2026-05-25 15:29:50.361853+12	[]	0.00	0.00	[]	f	1
dc73a7d4-ae53-40ce-9ca5-b5c105bdec76	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	Well	Get ready to explore the breathtaking landscapes of Kiwi Land (New Zealand) on a budget-friendly adventure. We'll start our journey in Auckland, experiencing its vibrant culture, before heading to the geothermal wonders of Rotorua. Then, it's off to the stunning natural beauty of Tongariro National Park and the relaxing beaches of Tauranga. Finally, we'll wrap up with a visit to the artistic and cultural hub of Wellington.	Auckland	1	7	budget	[{"id": "queenstown", "name": "Queenstown", "emoji": "🏞️", "country": "New Zealand"}, {"id": "christchurch", "name": "Christchurch", "emoji": "🌿", "country": "New Zealand"}, {"id": "dunedin", "name": "Dunedin", "emoji": "🏰", "country": "New Zealand"}]	saved	2026-05-25 15:31:38.530742+12	2026-05-25 15:31:38.530742+12	[]	0.00	0.00	[]	f	1
4e317a08-9cec-4359-9eca-9a46a3a4c714	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	test	Get ready to explore the breathtaking landscapes of Kiwi Land (New Zealand) on a budget-friendly adventure. We'll start our journey in Auckland, experiencing its vibrant culture, before heading to the geothermal wonders of Rotorua. Then, it's off to the stunning natural beauty of Tongariro National Park and the relaxing beaches of Tauranga. Finally, we'll wrap up with a visit to the artistic and cultural hub of Wellington.	Auckland	1	7	budget	[{"id": "queenstown", "name": "Queenstown", "emoji": "🏞️", "country": "New Zealand"}, {"id": "christchurch", "name": "Christchurch", "emoji": "🌿", "country": "New Zealand"}, {"id": "dunedin", "name": "Dunedin", "emoji": "🏰", "country": "New Zealand"}]	saved	2026-05-25 15:32:21.587922+12	2026-05-25 15:32:21.587922+12	[]	0.00	0.00	[]	f	1
71f6407a-18fe-45fe-862a-7278df1e4019	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	Rotorua	Get ready to explore the breathtaking landscapes of Kiwi Land (New Zealand) on a budget-friendly adventure. We'll start our journey in Auckland, experiencing its vibrant culture, before heading to the geothermal wonders of Rotorua. Then, it's off to the stunning natural beauty of Tongariro National Park and the relaxing beaches of Tauranga. Finally, we'll wrap up with a visit to the artistic and cultural hub of Wellington.	Auckland	1	7	budget	[{"id": "queenstown", "name": "Queenstown", "emoji": "🏞️", "country": "New Zealand"}, {"id": "christchurch", "name": "Christchurch", "emoji": "🌿", "country": "New Zealand"}, {"id": "dunedin", "name": "Dunedin", "emoji": "🏰", "country": "New Zealand"}]	saved	2026-05-25 15:35:07.847203+12	2026-05-25 15:35:07.847203+12	[]	0.00	0.00	[]	f	1
392f50ff-b175-4f35-9df5-a57e99bb7a01	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	NZ Budget trip	Get ready to explore the breathtaking landscapes of Kiwi Land (New Zealand) on a budget-friendly adventure. We'll start our journey in Auckland, experiencing its vibrant culture, before heading to the geothermal wonders of Rotorua. Then, it's off to the stunning natural beauty of Tongariro National Park and the relaxing beaches of Tauranga. Finally, we'll wrap up with a visit to the artistic and cultural hub of Wellington.	Auckland	1	7	budget	[{"id": "queenstown", "name": "Queenstown", "emoji": "🏞️", "country": "New Zealand"}, {"id": "christchurch", "name": "Christchurch", "emoji": "🌿", "country": "New Zealand"}, {"id": "dunedin", "name": "Dunedin", "emoji": "🏰", "country": "New Zealand"}]	saved	2026-05-27 15:18:06.171235+12	2026-05-27 15:18:06.171235+12	[]	0.00	0.00	[]	f	1
6e6c99c9-2086-4456-ac4b-247f8d166271	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	testzzzz	Get ready to explore the breathtaking landscapes of Kiwi Land (New Zealand) on a budget-friendly adventure. We'll start our journey in Auckland, experiencing its vibrant culture, before heading to the geothermal wonders of Rotorua. Then, it's off to the stunning natural beauty of Tongariro National Park and the relaxing beaches of Tauranga. Finally, we'll wrap up with a visit to the artistic and cultural hub of Wellington.	Auckland	1	7	budget	[{"id": "queenstown", "name": "Queenstown", "emoji": "🏞️", "country": "New Zealand"}, {"id": "christchurch", "name": "Christchurch", "emoji": "🌿", "country": "New Zealand"}, {"id": "dunedin", "name": "Dunedin", "emoji": "🏰", "country": "New Zealand"}]	saved	2026-06-17 12:49:24.71513+12	2026-06-17 12:49:24.71513+12	[]	0.00	0.00	["bbbbbbbb-0002-0002-0002-000000000002", "aaaaaaaa-0001-0001-0001-000000000001", "cccccccc-0003-0003-0003-000000000003"]	f	1
b861bb2e-e5d0-4c74-97c1-3eb7809d3952	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	aaa	Get ready to explore the breathtaking landscapes of Kiwi Land (New Zealand) on a budget-friendly adventure. We'll start our journey in Auckland, experiencing its vibrant culture, before heading to the geothermal wonders of Rotorua. Then, it's off to the stunning natural beauty of Tongariro National Park and the relaxing beaches of Tauranga. Finally, we'll wrap up with a visit to the artistic and cultural hub of Wellington.	Auckland	1	7	budget	[{"id": "queenstown", "name": "Queenstown", "emoji": "🏞️", "country": "New Zealand"}, {"id": "christchurch", "name": "Christchurch", "emoji": "🌿", "country": "New Zealand"}, {"id": "dunedin", "name": "Dunedin", "emoji": "🏰", "country": "New Zealand"}]	saved	2026-06-17 15:41:40.682053+12	2026-06-17 15:41:40.682053+12	[]	0.00	0.00	["bbbbbbbb-0002-0002-0002-000000000002", "aaaaaaaa-0001-0001-0001-000000000001", "cccccccc-0003-0003-0003-000000000003"]	f	1
c7b5271a-fe62-4089-b6fc-1cf537d8cdcc	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	7-Days Budget NZ Trip	Get ready to explore the breathtaking landscapes of Kiwi Land (New Zealand) on a budget-friendly adventure. We'll start our journey in Auckland, experiencing its vibrant culture, before heading to the geothermal wonders of Rotorua. Then, it's off to the stunning natural beauty of Tongariro National Park and the relaxing beaches of Tauranga. Finally, we'll wrap up with a visit to the artistic and cultural hub of Wellington.	Auckland	1	7	budget	[{"id": "queenstown", "name": "Queenstown", "emoji": "🏞️", "country": "New Zealand"}, {"id": "christchurch", "name": "Christchurch", "emoji": "🌿", "country": "New Zealand"}, {"id": "dunedin", "name": "Dunedin", "emoji": "🏰", "country": "New Zealand"}]	saved	2026-06-22 14:59:20.306213+12	2026-06-22 14:59:20.306213+12	[]	0.00	0.00	["bbbbbbbb-0002-0002-0002-000000000002", "aaaaaaaa-0001-0001-0001-000000000001", "cccccccc-0003-0003-0003-000000000003"]	f	1
c144dee9-6092-4039-a713-c9aa18ff3eda	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	7days 9K Dubai Trip for 2 paxs	A 7-day shopping and cultural exploration trip to Dubai, departing from Auckland, with a budget of NZD 9000 for two travelers. Enjoy iconic attractions like the Burj Khalifa and Dubai Mall, combined with cultural experiences at Dubai Creek and relaxation at Jumeirah Beach.	Auckland	2	7	budget	[{"id": "2", "name": "Abu Dhabi", "emoji": "🕌", "country": "United Arab Emirates"}]	saved	2026-07-27 09:45:28.228228+12	2026-07-27 09:45:28.228228+12	[]	0.00	0.00	["4"]	f	1
28e18650-5dff-44e7-9749-b337b1954991	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	Auckland Trip	Embark on a 7-day adventure in Dubai, experiencing its luxurious shopping, iconic skyscrapers, and cultural richness, all within a budget-friendly framework from Auckland, New Zealand.	Auckland	2	7	budget	[{"id": "dubai-mall", "name": "Dubai Mall", "emoji": "🛍️", "country": "United Arab Emirates"}, {"id": "burj-khalifa", "name": "Burj Khalifa", "emoji": "🏙️", "country": "United Arab Emirates"}]	saved	2026-07-27 13:16:10.065129+12	2026-07-27 13:16:10.065129+12	[]	0.00	0.00	["4"]	f	1
b54008d8-26a8-4515-a29c-481c9c8fc9aa	4c8663a6-7539-48e1-afb6-9033d460503e	Auckland Trip	Explore Wellington's cultural hotspots and scenic vistas over a 4-day trip with a budget-friendly approach.	Auckland	2	4	budget	[{"id": "auckland", "name": "Auckland", "emoji": "🪁", "country": "New Zealand"}]	saved	2026-07-27 13:31:08.751534+12	2026-07-27 13:31:08.751534+12	[]	0.00	0.00	["3"]	f	1
2c827313-6122-44db-9355-f869b71c8127	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	Auckland Trip	A 7-day shopping and cultural adventure in Dubai for two, departing from Auckland with a budget of NZD 9,000.	Auckland	2	7	budget	[]	saved	2026-07-27 14:19:57.635533+12	2026-07-27 14:19:57.635533+12	[]	0.00	0.00	["4"]	f	1
\.


--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_preferences (id, user_id, budget_amount, currency, destination, location_types, travel_style, created_at, updated_at) FROM stdin;
1	368387ce-29cb-4693-af69-a7108ba47982	1000.00	SGD	Bali	["Beach"]	{}	2026-04-29 10:24:38.786236+12	2026-04-29 10:24:38.786236+12
2	5838ed8b-0625-40e7-b627-de8f0d081561	60000.00	SGD	Butan	["Countryside", "Mountain", "Wellness", "Cultural"]	{}	2026-05-01 12:42:30.144056+12	2026-05-01 12:42:30.144056+12
6	b7ab8fd9-987c-4d8d-b61b-e5af7df176f3	\N	USD	\N	[]	{}	2026-05-19 23:55:31.211113+12	2026-05-19 23:55:31.211113+12
8	97d0462c-88f1-447a-a6e3-7fc7f0b309eb	\N	NZD	\N	[]	{}	2026-05-27 13:55:49.267365+12	2026-05-27 13:55:49.267365+12
9	aa2f7d86-258b-42fa-ae41-b2bf5fd5173e	\N	NZD	\N	[]	{}	2026-06-17 13:56:13.575501+12	2026-06-17 13:56:13.575501+12
13	467ac61c-9abc-4519-b1bf-646ac1404b39	\N	NZD	\N	[]	{}	2026-06-22 15:12:09.043117+12	2026-06-22 15:12:09.043117+12
68	a3de112d-dbc4-43b4-af9e-016b01286f89	\N	NZD	\N	[]	{}	2026-07-20 12:53:14.788341+12	2026-07-20 12:53:14.788341+12
69	f5bb7aa0-9ac1-4b1c-8003-6435a6f96b05	\N	NZD	\N	[]	{}	2026-07-20 12:57:28.87092+12	2026-07-20 12:57:28.87092+12
118	b9de6b4a-6183-4cc7-b2df-6da77f32634f	\N	NZD	\N	[]	{}	2026-07-27 12:56:21.409732+12	2026-07-27 12:56:21.409732+12
97	48339ec4-c251-4476-8b7c-9aa45d59f9d4	\N	USD	Dubai	["city exploration", "culture"]	{"days": 5, "budgetLevel": "5000 USD"}	2026-07-23 16:11:40.405196+12	2026-07-27 13:15:01.21375+12
113	4c8663a6-7539-48e1-afb6-9033d460503e	1000.00	NZD	Wellington	[]	{"days": 4, "budgetLevel": "budget"}	2026-07-27 12:10:18.631317+12	2026-07-27 13:30:17.588755+12
3	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	1000.00	USD	Dubai	["shopping"]	{"days": 7, "budgetLevel": "budget"}	2026-05-01 16:15:59.551268+12	2026-07-27 14:18:47.661222+12
98	21d0a265-7c5e-4d82-b6cb-417edc7f7c28	\N	USD	\N	[]	{}	2026-07-23 17:02:33.876104+12	2026-07-23 17:02:33.876104+12
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_profiles (id, user_id, dob, nationality, avatar_url, bio, created_at, updated_at, agency_name, agency_license, agency_logo_url, specialties) FROM stdin;
1	368387ce-29cb-4693-af69-a7108ba47982	2000-01-01	Singaporean	\N	\N	2026-04-29 10:24:38.786236+12	2026-04-29 10:24:38.786236+12	\N	\N	\N	[]
2	5838ed8b-0625-40e7-b627-de8f0d081561	1900-11-11	British	\N	\N	2026-05-01 12:42:30.144056+12	2026-05-01 12:42:30.144056+12	\N	\N	\N	[]
3	43e5dfd0-0f12-4980-8d9c-8b96209cfae5	\N	\N	\N	\N	2026-05-01 16:15:59.551268+12	2026-05-01 16:15:59.551268+12	\N	\N	\N	[]
6	b7ab8fd9-987c-4d8d-b61b-e5af7df176f3	\N	\N	\N	\N	2026-05-19 23:55:31.211113+12	2026-05-19 23:55:31.211113+12	\N	\N	\N	[]
8	97d0462c-88f1-447a-a6e3-7fc7f0b309eb	1988-05-21	Singaporean	\N	\N	2026-05-27 13:55:49.267365+12	2026-05-27 13:55:49.267365+12	\N	\N	\N	[]
9	aa2f7d86-258b-42fa-ae41-b2bf5fd5173e	\N	\N	\N	\N	2026-06-17 13:56:13.575501+12	2026-06-17 13:56:13.575501+12	\N	\N	\N	[]
13	467ac61c-9abc-4519-b1bf-646ac1404b39	\N	\N	\N	\N	2026-06-22 15:12:09.043117+12	2026-06-22 15:12:09.043117+12	\N	\N	\N	[]
14	a3de112d-dbc4-43b4-af9e-016b01286f89	\N	\N	\N	\N	2026-07-20 12:53:14.788341+12	2026-07-20 12:53:14.788341+12	\N	\N	\N	[]
15	f5bb7aa0-9ac1-4b1c-8003-6435a6f96b05	\N	\N	\N	\N	2026-07-20 12:57:28.87092+12	2026-07-20 12:57:28.87092+12	\N	\N	\N	[]
25	48339ec4-c251-4476-8b7c-9aa45d59f9d4	\N	\N	\N	\N	2026-07-23 16:11:40.405196+12	2026-07-23 16:11:40.405196+12	\N	\N	\N	[]
26	21d0a265-7c5e-4d82-b6cb-417edc7f7c28	\N	Myanmar	\N	Techkie	2026-07-23 17:02:33.876104+12	2026-07-23 17:02:33.876104+12	\N	\N	\N	["Adventure", "Budget", "Honeymoon", "Wellness", "Cultural"]
27	4c8663a6-7539-48e1-afb6-9033d460503e	\N	\N	\N	\N	2026-07-27 12:10:18.631317+12	2026-07-27 12:10:18.631317+12	\N	\N	\N	[]
28	b9de6b4a-6183-4cc7-b2df-6da77f32634f	\N	\N	\N	\N	2026-07-27 12:56:21.409732+12	2026-07-27 12:56:21.409732+12	\N	\N	\N	[]
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, first_name, last_name, email, phone, password_hash, role_type, status, auth_provider, provider_id, email_verified, last_login_at, created_at, updated_at) FROM stdin;
5838ed8b-0625-40e7-b627-de8f0d081561	abcd	sourceinfinity	abcd@gmail.com	+64290450454545	$2b$12$UltAd1yqzXWoXcWvS4S3I.8kArubqeHA0e8hPPjbNJTIQIbQ4JMky	agent	active	local	\N	t	\N	2026-05-01 12:42:30.144056+12	2026-05-01 12:42:30.144056+12
b7ab8fd9-987c-4d8d-b61b-e5af7df176f3	Test	\N	testuser2358@example.com	\N	$2b$12$sM8rp/ZBZ4sxgLBPKOADh.jPlbePuKCDf7t4m6zrNOgCcRS3v7P12	agent	active	local	\N	t	\N	2026-05-19 23:55:31.211113+12	2026-05-19 23:55:31.211113+12
aa2f7d86-258b-42fa-ae41-b2bf5fd5173e	Test	User	testuser@travelai.com	1234567890	$2b$12$wIPvjaBnoNnblsPbj612W.LiE8LHO87rkQ4mqRjHHV.AQh0P/QeYK	agent	active	local	\N	t	\N	2026-06-17 13:56:13.575501+12	2026-06-17 13:56:13.575501+12
a3de112d-dbc4-43b4-af9e-016b01286f89	Test	User	traveler_test_123@example.com	0211234567	$2b$12$Ns7/PJOsnFI7/hAmb1Imd.1vRZjB/6SB7ps.6/SZ7f0lqxa6Tkbre	agent	active	local	\N	t	\N	2026-07-20 12:53:14.788341+12	2026-07-20 12:53:14.788341+12
368387ce-29cb-4693-af69-a7108ba47982	Mia	Source Infinity	mia.sourceinfinity@gmail.com	+642904508845	$2b$12$q9ZqryLCmULPgNoHbqdLnOjh0lnw.chaTZ8GYYYLxdTNYzvnrzhXi	agent	active	local	\N	t	2026-05-08 16:39:06.445302+12	2026-04-29 10:24:38.786236+12	2026-05-08 16:39:06.445302+12
467ac61c-9abc-4519-b1bf-646ac1404b39	John	Doe	johndoe@testing123.com	+642904502345	$2b$12$9AphQRcI3iE9qZk07jLmlODx5yH3xDG.l8z1J.QW3.L02GMJ3eCQ.	agent	active	local	\N	t	\N	2026-06-22 15:12:09.043117+12	2026-06-22 15:12:09.043117+12
97d0462c-88f1-447a-a6e3-7fc7f0b309eb	M	Chin	myathuzarlwyn@gmail.com	+642901234567	$2b$12$FwFMYxV6ZBITSxxZ2MNDuOSzyvF2VHYWYMP55KlKoribE2gP7Tn8a	agent	active	local	\N	t	\N	2026-05-27 13:55:49.267365+12	2026-05-27 13:55:49.267365+12
b9de6b4a-6183-4cc7-b2df-6da77f32634f	Alex	Johnson	testuser@example.com	0211234567	$2b$12$Qa273.un1MiPlw8cN7.Ftu/3s8Uy6nhWKh.iP52.OfA4Dgkg4QYGS	traveler	pending	local	\N	f	\N	2026-07-27 12:56:21.409732+12	2026-07-27 12:56:21.409732+12
f5bb7aa0-9ac1-4b1c-8003-6435a6f96b05	Test	User	traveler_test_456@example.com	0211234567	$2b$12$FJEBPpz3QU8FTvHjFndDU.e6ytnD0R420ZkwgXwUAZ.v4y9IZqxky	agent	suspended	local	\N	t	\N	2026-07-20 12:57:28.87092+12	2026-07-23 16:40:45.921481+12
48339ec4-c251-4476-8b7c-9aa45d59f9d4	Mia	Super Admin	mia.superadmin@travelai.co.nz	\N	$2b$12$A1Iwr30seuM.F4Z6l2daLOAIP.QIxrpQWZNo5i03.IEzZ1JOWfGiO	superadmin	active	local	\N	t	2026-07-27 13:05:37.443185+12	2026-07-23 16:11:40.405196+12	2026-07-27 13:05:37.443185+12
21d0a265-7c5e-4d82-b6cb-417edc7f7c28	M	K	emeraldnovam@gmail.com	+642904501234	$2b$12$ajv0VJPgZAtxlneCKJxCb.sKoIItnwcrclYyr3NLake4U83TOetRa	agent	active	local	\N	t	2026-07-23 17:11:09.388546+12	2026-07-23 17:02:33.876104+12	2026-07-23 17:11:09.388546+12
4c8663a6-7539-48e1-afb6-9033d460503e	Test Traveller	001	shwepinlon26@gmail.com	+642904505634	$2b$12$4OeSliaaHtj4ye.H47P37uP2MeSuc84AeJl5vaGwAPtb0v9SQF7XK	traveler	active	local	\N	t	2026-07-27 13:26:42.916156+12	2026-07-27 12:10:18.631317+12	2026-07-27 13:26:42.916156+12
43e5dfd0-0f12-4980-8d9c-8b96209cfae5	mya.	sourceinfinity	mya.sourceinfinity@gmail.com	\N	\N	agent	active	google	105859289246354717722	t	2026-07-27 14:16:34.264615+12	2026-05-01 16:15:59.551268+12	2026-07-27 14:16:34.264615+12
\.


--
-- Name: agent_packages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agent_packages_id_seq', 6, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 194, true);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 1, false);


--
-- Name: chat_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_sessions_id_seq', 1, false);


--
-- Name: logins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.logins_id_seq', 157, true);


--
-- Name: password_resets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_resets_id_seq', 1, false);


--
-- Name: schema_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schema_migrations_id_seq', 15, true);


--
-- Name: user_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_preferences_id_seq', 127, true);


--
-- Name: user_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_profiles_id_seq', 28, true);


--
-- Name: agent_package_components agent_package_components_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_package_components
    ADD CONSTRAINT agent_package_components_pkey PRIMARY KEY (id);


--
-- Name: agent_packages agent_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_packages
    ADD CONSTRAINT agent_packages_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_sessions chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: destinations destinations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.destinations
    ADD CONSTRAINT destinations_pkey PRIMARY KEY (id);


--
-- Name: logins logins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logins
    ADD CONSTRAINT logins_pkey PRIMARY KEY (id);


--
-- Name: logins logins_session_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logins
    ADD CONSTRAINT logins_session_token_key UNIQUE (session_token);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_filename_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_filename_key UNIQUE (filename);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: trips trips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_agent_package_components_package; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agent_package_components_package ON public.agent_package_components USING btree (package_id);


--
-- Name: idx_agent_packages_destination; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agent_packages_destination ON public.agent_packages USING btree (lower((destination_name)::text));


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_event_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_event_type ON public.audit_logs USING btree (event_type);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_chat_messages_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_session_id ON public.chat_messages USING btree (session_id);


--
-- Name: idx_destinations_trip_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_destinations_trip_id ON public.destinations USING btree (trip_id);


--
-- Name: idx_logins_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logins_active ON public.logins USING btree (user_id, expires_at) WHERE (revoked = false);


--
-- Name: idx_logins_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logins_expires_at ON public.logins USING btree (expires_at);


--
-- Name: idx_logins_session_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logins_session_token ON public.logins USING btree (session_token);


--
-- Name: idx_logins_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logins_user_id ON public.logins USING btree (user_id);


--
-- Name: idx_password_resets_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_resets_token ON public.password_resets USING btree (token_hash);


--
-- Name: idx_password_resets_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_resets_user ON public.password_resets USING btree (user_id);


--
-- Name: idx_trips_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trips_user_id ON public.trips USING btree (user_id);


--
-- Name: idx_user_preferences_location_types; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_preferences_location_types ON public.user_preferences USING gin (location_types);


--
-- Name: idx_user_preferences_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences USING btree (user_id);


--
-- Name: idx_user_profiles_specialties; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_profiles_specialties ON public.user_profiles USING gin (specialties);


--
-- Name: idx_user_profiles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_provider_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_provider_id ON public.users USING btree (provider_id) WHERE (provider_id IS NOT NULL);


--
-- Name: idx_users_role_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role_type ON public.users USING btree (role_type);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- Name: trips trips_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: agent_package_components agent_package_components_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_package_components
    ADD CONSTRAINT agent_package_components_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.agent_packages(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: chat_messages chat_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE;


--
-- Name: chat_sessions chat_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: destinations destinations_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.destinations
    ADD CONSTRAINT destinations_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;


--
-- Name: logins logins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logins
    ADD CONSTRAINT logins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_resets password_resets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: trips trips_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict EygQrQPqIvxDkcnxb0E1xbH82Vmgg9Sie4bNRIcHpl7v1V38fsMHVL9ZHt4LraH

