# Phase 2 Spec — Project Data Layer & Project Setup

> Captured verbatim from ROADMAP.md before it was repurposed as the phase tracker, so the
> original brief isn't lost. This is the source of truth for Phase 2 scope.

Phase 1 is fully approved.

The Office Add-in is now running successfully inside Excel.

We are starting Phase 2.

IMPORTANT:

Do NOT implement New Estimate.
Do NOT generate Excel tables.
Do NOT implement calculations.
Do NOT hardcode any materials.

This phase is only about creating the project data layer and project setup.

========================================================

OBJECTIVE

Create a flexible architecture that allows unlimited materials and project-specific pricing.

========================================================

STEP 1

Create a Material Repository.

Material Manager should NOT store prices.

Each material should contain:

- id
- name
- category
- unit
- hasMpCost

Category enum:

Pipe
Cable
Accessory

Unit enum:

m
pcs

Examples:

EMT 3/4"
Pipe
m
true

Cable 2C
Cable
m
false

Flex Box
Accessory
pcs
false

========================================================

STEP 2

Create Project Settings model.

Project Settings contains:

Project Name

OH Percentage

Margin Percentage

Second Fix MP Price

Material Prices

Each material price contains:

materialId

unitCost

mpCost

This allows every project to have different prices without modifying Material Manager.

========================================================

STEP 3

Implement Storage Service.

Persist:

Materials

Project Settings

using Office Runtime Storage.

The user should never lose data after restarting Excel.

========================================================

STEP 4

Implement Material Manager page.

Features:

List materials

Create material

Edit material

Delete material

Validation:

No duplicate names.

Pipe:

can enable MP.

Cable:

MP disabled.

Accessory:

MP disabled.

Use Fluent UI components.

========================================================

STEP 5

Implement Setup page.

Project Name

OH %

Margin %

Second Fix MP

Below that,

display all materials dynamically.

For every material:

Unit Cost

If hasMpCost == true

show MP Cost.

Otherwise hide MP Cost.

Changes should save automatically.

========================================================

Requirements

Use SOLID.

Keep UI and logic separated.

Use reusable components.

No calculations.

No Excel generation.

No placeholder fake data.

Everything must be dynamic.

When Phase 2 is complete:

Stop.

Explain the architecture.

Wait for approval before starting Phase 3.
