export const SOP_GENERAL_WARD = `HOSPITAL STANDARD OPERATING PROCEDURE (HSOP-101): PATIENT ROOM SAFETY

1. Bed Safety:
   - Patient beds must be in the lowest position unless care is being administered.
   - Brakes on bed wheels must be locked at all times.
   - Side rails should be raised for patients assessed as fall risks (usually top two rails).
   - Call bell must be within the patient's reach.

2. Environmental Hygiene & Trip Hazards:
   - Floors must be clear of clutter, cables, and spilled liquids.
   - Medical waste bins (red) and sharps containers must not be overflowing.
   - Overbed tables should be clean and clear of non-essential items.

3. Infection Control:
   - Hand sanitizer dispenser must be accessible and functional upon entry/exit.
   - Personal Protective Equipment (PPE) station must be stocked (gloves, masks, gowns).

4. Equipment & Medication:
   - IV poles must be stable.
   - No loose medications left on bedside tables.
   - Oxygen tanks must be secured in a stand or cart, never free-standing.
`;

export const SOP_ICU = `ICU INFECTION CONTROL & CRITICAL CARE SAFETY (HSOP-200)

1. Invasive Line & Tube Maintenance:
   - Central venous catheters (CVC), arterial lines, and foley catheters must be secured properly.
   - Ventilator tubing must be suspended to prevent condensation backflow; water traps must not be overfilled.
   - All tubing must be free of kinks and not dragging on the floor.

2. Isolation & PPE Compliance:
   - Isolation signage (Contact, Droplet, Airborne) must be clearly posted on room entry doors.
   - PPE carts immediately outside the room must be stocked with gowns, gloves, and appropriate masks.
   - Negative pressure monitors (if applicable) must indicate proper pressure gradients.

3. Monitor & Alarm Safety:
   - Cardiac monitors must be visible from the nursing station.
   - Alarm limits must be set appropriate to patient physiology; no alarms silenced without assessment.

4. Sterile Field & Hygiene:
   - Hand hygiene dispensers at the foot of the bed must be functional.
   - Sterile fields (if active) must be preserved; no non-sterile items on sterile trays.
   - Dirty utility items (bedpans, soiled linens) must be removed immediately.
`;

export const SOP_ER = `EMERGENCY DEPARTMENT TRIAGE & TRAUMA SAFETY (HSOP-300)

1. Triage & Pathway Accessibility:
   - Hallways and gurney pathways must be completely clear of equipment and obstructions to ensure rapid transport.
   - Wheelchairs and stretchers must be stored in designated bays, not blocking fire exits.

2. Resuscitation Equipment (Crash Carts):
   - Crash carts must be unobstructed, plugged in (charging), and have a locked/intact breakaway seal.
   - Oxygen flowmeters and suction regulators must be present and functional at every headwall.

3. Sharps & Hazardous Waste:
   - High-volume trauma areas must have accessible, non-overflowing sharps containers.
   - Biohazard spill kits must be accessible in the utility area.

4. Patient Privacy & Security:
   - Curtains or doors must be fully closable for patient dignity.
   - Panic buttons/duress alarms at the nursing station must be accessible and unobstructed.
   - Patient belongings must be bagged and labelled to prevent loss/tripping.
`;

export const DEFAULT_SOP = SOP_GENERAL_WARD;

export const SOP_PRESETS: Record<string, { label: string; text: string }> = {
  'ward': { label: 'General Ward Safety (Default)', text: SOP_GENERAL_WARD },
  'icu': { label: 'ICU Infection Control', text: SOP_ICU },
  'er': { label: 'Emergency Room Triage Area', text: SOP_ER },
  'custom': { label: 'Custom', text: '' }
};
