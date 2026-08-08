# Electrical Estimator Excel Add-in

## Overview

Build a professional Microsoft Excel Office Add-in for electrical estimation.

The add-in should generate professionally formatted estimate tables directly inside Excel, calculate all costs automatically, and allow project-specific pricing.

The UI should be modern, clean and built using React + TypeScript.

This is NOT a VBA project.

Use:

- Office.js
- React
- TypeScript
- Fluent UI
- Office Add-in Task Pane
- Clean Architecture

---

# Main Goals

The add-in should:

- Store project pricing.
- Generate estimate tables.
- Calculate all costs.
- Apply formatting automatically.
- Support unlimited materials.
- Be easily extendable.

---

# Architecture

Create a scalable architecture.

src/

components/
Setup/
NewEstimate/
Projects/
PriceManager/
Navigation/

services/
excel.ts
storage.ts
calculator.ts

models/
Material.ts
Estimate.ts
Project.ts

types/

hooks/

utils/

assets/

---

# Navigation

The sidebar should contain:

- Home
- New Estimate
- Setup
- Material Manager
- Projects
- Settings

Navigation should be component-based.

---

# Setup Page

Setup should allow entering:

Project Name

Materials:

- Cable 2C
- Cable 4C
- Modbus Cable
- EMT 3/4"
- RGS 3/4"
- Trunk 10x10
- Flex Box
- Flexible Point

Each material contains:

- Name
- Category
- Unit Cost

Categories:

Pipe

Cable

Accessory

---

# MP Prices

Store MP prices separately.

Example:

EMT

MP Price

RGS

MP Price

Trunk

MP Price

Second Fix MP

Price

---

# Percentages

Store:

OH & Super

Margin

These values may be zero.

---

# Material Manager

Material Manager must allow:

Create material

Edit material

Delete material

Every material contains:

ID

Name

Category

Unit Cost

Optional MP Cost

Categories:

Pipe

Cable

Accessory

Materials added here should automatically appear inside New Estimate.

Never hardcode materials.

Everything must be dynamic.

---

# New Estimate

The user enters:

Estimate Title

Example:

General Extract Fan (EMT)

---

User can add unlimited:

Pipes

Cables

Accessories

Each row contains:

Material

Length

Quantity

---

Accessories contain only Quantity.

---

Pipe Cost Formula

Pipe Cost

=

Length × Quantity × Unit Cost

---

Cable Cost Formula

Cable Cost

=

Length × Quantity × Unit Cost

---

Accessory Cost Formula

Accessory Cost

=

Quantity × Unit Cost

---

First Fix MP Formula

Each pipe type has its own MP price.

Formula:

For every pipe

Length × Quantity × MP Price

Then sum all pipe MP values.

Example:

EMT:

30 × 2 × EMT MP

+

RGS:

20 × 1 × RGS MP

+

Trunk:

10 × 3 × Trunk MP

---

Second Fix MP

Second Fix MP is fixed.

Formula:

Quantity × Second Fix MP Price

---

Totals

First Fix Total

=

Pipe Costs

+

Pipe MP

+

Accessories

Second Fix Total

=

Cable Costs

+

Second Fix MP

+

Flexible Points

Total Price

=

First Fix Total

+

Second Fix Total

OH

=

Total Price × OH %

Margin

=

(Total Price + OH)

×

Margin %

Grand Total

=

Total Price

+

OH

+

Margin

---

Generate Estimate

When Generate is clicked:

The add-in creates the estimate table inside Excel.

Requirements:

Professional formatting

Borders

Background colors

Merged cells

Correct fonts

Auto column widths

Currency formatting

Formulas

Everything should resemble the provided Excel template.

---

Storage

Save project settings.

Save materials.

Persist values between sessions.

Use Office Storage APIs.

---

Future Ready

The project should be designed to easily support:

PDF Export

Duplicate Estimate

Update Prices

Dashboard

Multi Project Support

Cloud Sync

Do not implement these now.

Only prepare architecture.

---

Coding Rules

Use TypeScript.

Use reusable components.

Avoid duplicated code.

Separate UI from business logic.

Use interfaces.

Write clean code.

Follow SOLID principles.

Comment complex logic.

Keep everything modular.
