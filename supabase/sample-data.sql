-- Sample data for CondoMind: 3 buildings, 20 units, owners, tenants,
-- vendors and maintenance requests in every status.
--
-- Run it in the Supabase SQL editor after the migrations and after creating
-- the first manager (see README). Set v_email to that manager's email: the
-- sample buildings are linked to that account.
--
-- Running it again does nothing once the sample buildings exist.

do $$
declare
  v_email constant text := 'you@example.com';
  v_manager uuid;
begin
  select p.id into v_manager
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(u.email) = lower(v_email)
    and p.role = 'manager';

  if v_manager is null then
    raise exception 'No manager account uses %. Create the first manager, then set v_email.', v_email;
  end if;

  if exists (
    select 1 from public.buildings
    where name in ('Seri Kenanga Residences', 'Maple Suites', 'Mutiara Court')
  ) then
    raise notice 'Sample data is already loaded.';
    return;
  end if;

  -- Buildings

  insert into public.buildings (name, address, total_units) values
    ('Seri Kenanga Residences', '12 Jalan Kenanga 5, 55200 Kuala Lumpur', 8),
    ('Maple Suites', '18 Jalan Maple 3, 47300 Petaling Jaya, Selangor', 6),
    ('Mutiara Court', '7 Jalan Mutiara Emas 2, 81100 Johor Bahru, Johor', 6);

  insert into public.building_managers (user_id, building_id)
  select v_manager, b.id
  from public.buildings b
  where b.name in ('Seri Kenanga Residences', 'Maple Suites', 'Mutiara Court')
  on conflict do nothing;

  -- Units

  insert into public.units (building_id, unit_no, floor_area_sqft, share_units, status)
  select b.id, v.unit_no, v.sqft, v.share, v.status
  from (values
    ('Seri Kenanga Residences', 'A-05-01', 1050, 1.0, 'occupied'),
    ('Seri Kenanga Residences', 'A-05-02', 1050, 1.0, 'occupied'),
    ('Seri Kenanga Residences', 'A-08-03', 1280, 1.2, 'vacant'),
    ('Seri Kenanga Residences', 'A-12-01', 1450, 1.4, 'occupied'),
    ('Seri Kenanga Residences', 'B-03-02', 980, 0.9, 'occupied'),
    ('Seri Kenanga Residences', 'B-07-04', 1050, 1.0, 'occupied'),
    ('Seri Kenanga Residences', 'B-10-01', 1280, 1.2, 'under_renovation'),
    ('Seri Kenanga Residences', 'B-15-02', 1800, 1.7, 'occupied'),
    ('Maple Suites', 'M-02-01', 750, 0.8, 'occupied'),
    ('Maple Suites', 'M-02-05', 750, 0.8, 'occupied'),
    ('Maple Suites', 'M-06-03', 920, 1.0, 'occupied'),
    ('Maple Suites', 'M-09-02', 920, 1.0, 'occupied'),
    ('Maple Suites', 'M-11-04', 1100, 1.2, 'vacant'),
    ('Maple Suites', 'M-14-01', 1350, 1.4, 'occupied'),
    ('Mutiara Court', '1-01', 1200, 1.0, 'occupied'),
    ('Mutiara Court', '1-04', 1200, 1.0, 'occupied'),
    ('Mutiara Court', '2-02', 1200, 1.0, 'occupied'),
    ('Mutiara Court', '2-07', 1500, 1.3, 'vacant'),
    ('Mutiara Court', '3-03', 1200, 1.0, 'occupied'),
    ('Mutiara Court', '3-05', 1500, 1.3, 'under_renovation')
  ) as v (building, unit_no, sqft, share, status)
  join public.buildings b on b.name = v.building;

  -- Owners (every unit)

  insert into public.owners (unit_id, full_name, ic_no, email, phone)
  select u.id, v.full_name, v.ic_no, v.email, v.phone
  from (values
    ('Seri Kenanga Residences', 'A-05-01', 'Tan Wei Ming', '780412-10-5001', 'weiming.tan@example.com', '+60 12-555 0101'),
    ('Seri Kenanga Residences', 'A-05-02', 'Nurul Aisyah binti Rahman', '850923-14-5002', 'nurul.aisyah@example.com', '+60 13-555 0102'),
    ('Seri Kenanga Residences', 'A-08-03', 'Rajesh Kumar a/l Subramaniam', '710305-08-5003', 'rajesh.kumar@example.com', '+60 16-555 0103'),
    ('Seri Kenanga Residences', 'A-12-01', 'Lim Mei Ling', '820716-14-5004', 'meiling.lim@example.com', '+60 12-555 0104'),
    ('Seri Kenanga Residences', 'B-03-02', 'Ahmad Faiz bin Ismail', '790128-01-5005', 'ahmad.faiz@example.com', '+60 19-555 0105'),
    ('Seri Kenanga Residences', 'B-07-04', 'Wong Kar Hoe', '880601-10-5006', 'karhoe.wong@example.com', '+60 17-555 0106'),
    ('Seri Kenanga Residences', 'B-10-01', 'Priya Devi a/p Krishnan', '900214-07-5007', 'priya.devi@example.com', '+60 12-555 0107'),
    ('Seri Kenanga Residences', 'B-15-02', 'Chong Siew Lan', '690830-14-5008', 'siewlan.chong@example.com', '+60 13-555 0108'),
    ('Maple Suites', 'M-02-01', 'Muhammad Hakim bin Yusof', '920507-10-5009', 'hakim.yusof@example.com', '+60 11-555 0109'),
    ('Maple Suites', 'M-02-05', 'Ng Pei Shan', '860319-10-5010', 'peishan.ng@example.com', '+60 12-555 0110'),
    ('Maple Suites', 'M-06-03', 'Siti Hajar binti Osman', '830911-03-5011', 'siti.hajar@example.com', '+60 19-555 0111'),
    ('Maple Suites', 'M-09-02', 'David Teoh Kok Leong', '750625-07-5012', 'david.teoh@example.com', '+60 16-555 0112'),
    ('Maple Suites', 'M-11-04', 'Kavitha a/p Ramasamy', '870102-10-5013', 'kavitha.r@example.com', '+60 12-555 0113'),
    ('Maple Suites', 'M-14-01', 'Lee Chee Keong', '730418-14-5014', 'cheekeong.lee@example.com', '+60 17-555 0114'),
    ('Mutiara Court', '1-01', 'Zainab binti Abdullah', '680920-01-5015', 'zainab.abdullah@example.com', '+60 13-555 0115'),
    ('Mutiara Court', '1-04', 'Goh Boon Huat', '810227-01-5016', 'boonhuat.goh@example.com', '+60 12-555 0116'),
    ('Mutiara Court', '2-02', 'Farah Nadia binti Hassan', '910811-01-5017', 'farah.nadia@example.com', '+60 11-555 0117'),
    ('Mutiara Court', '2-07', 'Ong Teck Seng', '770503-01-5018', 'teckseng.ong@example.com', '+60 16-555 0118'),
    ('Mutiara Court', '3-03', 'Suresh a/l Muthu', '840706-01-5019', 'suresh.muthu@example.com', '+60 19-555 0119'),
    ('Mutiara Court', '3-05', 'Yap Hui Min', '890115-01-5020', 'huimin.yap@example.com', '+60 12-555 0120')
  ) as v (building, unit_no, full_name, ic_no, email, phone)
  join public.buildings b on b.name = v.building
  join public.units u on u.building_id = b.id and u.unit_no = v.unit_no;

  -- Tenants (rented units)

  insert into public.tenants (unit_id, full_name, ic_no, email, phone, lease_start, lease_end)
  select u.id, v.full_name, v.ic_no, v.email, v.phone, v.lease_start::date, v.lease_end::date
  from (values
    ('Seri Kenanga Residences', 'A-05-02', 'Daniel Lau Jun Hao', '950603-10-6001', 'daniel.lau@example.com', '+60 12-555 0201', '2026-01-01', '2027-12-31'),
    ('Seri Kenanga Residences', 'B-03-02', 'Aina Sofea binti Kamal', '980214-14-6002', 'aina.sofea@example.com', '+60 13-555 0202', '2025-07-01', '2026-12-31'),
    ('Seri Kenanga Residences', 'B-15-02', 'Arjun a/l Pillai', '930929-08-6003', 'arjun.pillai@example.com', '+60 16-555 0203', '2026-03-15', '2028-03-14'),
    ('Maple Suites', 'M-02-05', 'Chloe Tan Xin Yi', '990420-10-6004', 'chloe.tan@example.com', '+60 11-555 0204', '2026-02-01', '2027-01-31'),
    ('Maple Suites', 'M-09-02', 'Hafiz bin Zulkifli', '960112-10-6005', 'hafiz.z@example.com', '+60 19-555 0205', '2025-10-01', '2026-11-30'),
    ('Mutiara Court', '1-04', 'Michelle Khoo Li Wen', '940808-01-6006', 'michelle.khoo@example.com', '+60 12-555 0206', '2026-05-01', '2027-04-30'),
    ('Mutiara Court', '3-03', 'Irfan bin Rosli', '970326-01-6007', 'irfan.rosli@example.com', '+60 17-555 0207', '2026-08-01', '2028-07-31')
  ) as v (building, unit_no, full_name, ic_no, email, phone, lease_start, lease_end)
  join public.buildings b on b.name = v.building
  join public.units u on u.building_id = b.id and u.unit_no = v.unit_no;

  -- Vendors (skips any company that already exists)

  insert into public.vendors (company_name, contact_person, phone, service_type)
  select v.company_name, v.contact_person, v.phone, v.service_type
  from (values
    ('AquaFix Plumbing Services', 'Mohd Rizal', '+60 3-5555 1001', 'Plumbing'),
    ('BrightSpark Electrical', 'Kenny Chua', '+60 3-5555 1002', 'Electrical'),
    ('CoolBreeze Aircond Services', 'Vinod Nair', '+60 3-5555 1003', 'Air conditioning'),
    ('LiftCare Engineering', 'Steven Ho', '+60 3-5555 1004', 'Lift'),
    ('PestGuard Services', 'Rosnah Ali', '+60 3-5555 1005', 'Pest control'),
    ('SecureWatch Guarding', 'Kamarul Zaman', '+60 3-5555 1006', 'Security'),
    ('Sparkle Facility Cleaning', 'Jenny Loh', '+60 3-5555 1007', 'Cleaning'),
    ('SolidBuild Contractors', 'Ravi Shankar', '+60 3-5555 1008', 'Structural')
  ) as v (company_name, contact_person, phone, service_type)
  where not exists (
    select 1 from public.vendors existing where existing.company_name = v.company_name
  );

  -- Maintenance requests
  --
  -- The guard trigger stamps every insert as a new, untriaged request made
  -- now. It is paused here so the samples can have past dates, statuses,
  -- triage and vendors. The whole block is one transaction, so the trigger is
  -- back on even if something fails.
  --
  -- Requests with no category or notes are untriaged: opening one as a
  -- manager runs Suggested triage.

  alter table public.maintenance_requests disable trigger guard_maintenance_request;

  insert into public.maintenance_requests (
    unit_id, title, description, category, priority, status, ai_notes,
    assigned_vendor_id, submitted_at, resolved_at
  )
  select
    u.id, v.title, v.description, v.category, v.priority, v.status, v.notes,
    vendor.id,
    now() - make_interval(days => v.days_ago, hours => v.hour_offset),
    case when v.resolved_days_ago is null then null
         else now() - make_interval(days => v.resolved_days_ago) end
  from (values
    -- Seri Kenanga Residences
    ('Seri Kenanga Residences', 'A-05-01', 'Kitchen sink leaking under cabinet',
     'Water is dripping from the pipe joint under the kitchen sink. The cabinet floor is soaked and starting to swell.',
     'plumbing', 'high', 'in_progress',
     'Active leak with water damage to cabinetry. Shut the sink valve and replace the joint or trap.',
     'AquaFix Plumbing Services', 3, 4, null::int),
    ('Seri Kenanga Residences', 'A-05-02', 'Bedroom aircond not cooling',
     'The aircond in the master bedroom blows air but it is not cold, even on 18 degrees.',
     'air_conditioning', 'medium', 'open',
     'Likely low refrigerant or a dirty coil. Book a service and gas top-up check.',
     'CoolBreeze Aircond Services', 1, 2, null),
    ('Seri Kenanga Residences', 'A-12-01', 'Power trips when using the oven',
     'The main breaker trips every time we turn on the oven together with the water heater.',
     'electrical', 'urgent', 'in_progress',
     'Repeated tripping may point to an overloaded circuit or faulty appliance. Inspect the DB box and wiring soon.',
     'BrightSpark Electrical', 2, 6, null),
    ('Seri Kenanga Residences', 'B-03-02', 'Cockroaches in kitchen',
     'Seeing many small cockroaches around the kitchen cabinets at night for the past week.',
     'pest_control', 'medium', 'resolved',
     'Infestation in one unit. Treat the unit and check neighbouring units and the refuse chamber.',
     'PestGuard Services', 14, 3, 9),
    ('Seri Kenanga Residences', 'B-07-04', 'Lift B stuck between floors',
     'Lift B stopped between level 6 and 7 for about 10 minutes this morning before moving again.',
     'lift', 'urgent', 'resolved',
     'Safety issue in a shared lift. Take the lift out of service until the contractor inspects it.',
     'LiftCare Engineering', 20, 1, 18),
    ('Seri Kenanga Residences', 'B-15-02', 'Crack in living room wall',
     'A diagonal crack about 40 cm long has appeared above the living room window.',
     'structural', 'high', 'open',
     'Diagonal cracks near openings can indicate movement. Have a contractor assess before cosmetic repair.',
     'SolidBuild Contractors', 4, 1, null),
    ('Seri Kenanga Residences', 'A-12-01', 'Corridor lights off on level 12',
     'Half of the corridor lights on level 12 near lift lobby A are not working.',
     'common_area', 'low', 'closed',
     'Common area lighting. Replace bulbs during the next scheduled round.',
     'BrightSpark Electrical', 30, 5, 27),
    ('Seri Kenanga Residences', 'A-05-01', 'Bathroom floor trap smells',
     'There is a strong drain smell coming from the bathroom floor trap, worse at night.',
     null, 'medium', 'open', null, null, 0, 3, null),
    ('Seri Kenanga Residences', 'B-07-04', 'Visitor parked in my bay again',
     'A white car without a sticker has been parked in my allocated bay B2-114 for two days.',
     null, 'medium', 'open', null, null, 0, 6, null),

    -- Maple Suites
    ('Maple Suites', 'M-02-01', 'Water heater not working',
     'No hot water in the bathroom since yesterday. The heater light does not turn on.',
     'electrical', 'high', 'open',
     'Check the heater power supply and isolator before replacing the unit.',
     null, 1, 8, null),
    ('Maple Suites', 'M-02-05', 'Ceiling leak from unit above',
     'Brown water stain spreading on the bathroom ceiling, dripping when the upstairs unit showers.',
     'plumbing', 'high', 'in_progress',
     'Leak likely from the unit above. Inspect M-03-05 bathroom waterproofing and pipes.',
     'AquaFix Plumbing Services', 5, 2, null),
    ('Maple Suites', 'M-06-03', 'Gym treadmill broken',
     'The second treadmill in the level 5 gym stops after a few minutes.',
     'common_area', 'low', 'open',
     'Shared facility, not urgent. Put an out-of-order notice and arrange repair.',
     null, 6, 3, null),
    ('Maple Suites', 'M-09-02', 'Main door access card not working',
     'My access card stopped working at the lobby door and the car park barrier.',
     'security', 'medium', 'resolved',
     'Likely a deactivated or faulty card. Check the access system and reissue if needed.',
     'SecureWatch Guarding', 9, 4, 8),
    ('Maple Suites', 'M-14-01', 'Rubbish not collected on level 14',
     'The refuse chamber on level 14 has not been cleared for three days and smells bad.',
     'cleaning', 'medium', 'closed',
     'Hygiene issue in a shared area. Remind the cleaning contractor of the schedule.',
     'Sparkle Facility Cleaning', 12, 2, 11),
    ('Maple Suites', 'M-06-03', 'Aircond leaking water onto floor',
     'The living room aircond is dripping water down the wall onto the floor.',
     null, 'medium', 'open', null, null, 0, 1, null),

    -- Mutiara Court
    ('Mutiara Court', '1-01', 'Front gate motor faulty',
     'The main auto gate opens only halfway and makes a grinding noise.',
     'security', 'high', 'in_progress',
     'Gate is a security and access risk. Have the motor and tracks inspected.',
     'SecureWatch Guarding', 4, 5, null),
    ('Mutiara Court', '1-04', 'Termites on door frame',
     'Found mud tunnels and soft wood on the bedroom door frame.',
     'pest_control', 'high', 'open',
     'Termites can spread to other timber. Arrange inspection and treatment soon.',
     'PestGuard Services', 2, 3, null),
    ('Mutiara Court', '2-02', 'Toilet keeps running',
     'The toilet cistern keeps filling and does not stop unless I shut the valve.',
     'plumbing', 'low', 'resolved',
     'Likely a worn flush valve or float. Simple part replacement.',
     'AquaFix Plumbing Services', 16, 2, 13),
    ('Mutiara Court', '3-03', 'Swimming pool water is cloudy',
     'The pool water has been cloudy and green near the corners since the weekend.',
     'cleaning', 'medium', 'in_progress',
     'Water treatment issue in a shared facility. Test chemicals and clean filters.',
     'Sparkle Facility Cleaning', 3, 7, null),
    ('Mutiara Court', '1-01', 'Water seeping through balcony wall',
     'After heavy rain, water comes in where the balcony wall meets the floor.',
     'structural', 'medium', 'closed',
     'Waterproofing or sealant failure. Re-seal the joint and monitor after the next rain.',
     'SolidBuild Contractors', 40, 2, 32),
    ('Mutiara Court', '2-02', 'Sparks from kitchen power socket',
     'Saw sparks and a burning smell when plugging in the kettle. Socket is now black.',
     null, 'medium', 'open', null, null, 0, 2, null)
  ) as v (
    building, unit_no, title, description, category, priority, status, notes,
    vendor_name, days_ago, hour_offset, resolved_days_ago
  )
  join public.buildings b on b.name = v.building
  join public.units u on u.building_id = b.id and u.unit_no = v.unit_no
  left join lateral (
    select id from public.vendors
    where company_name = v.vendor_name
    order by created_at
    limit 1
  ) vendor on true;

  alter table public.maintenance_requests enable trigger guard_maintenance_request;

  raise notice 'Sample data loaded and linked to %.', v_email;
end;
$$;
