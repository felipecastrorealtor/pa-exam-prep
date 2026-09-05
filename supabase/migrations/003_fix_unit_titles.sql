-- ─────────────────────────────────────────────────────────────────────────────
-- FIX: unit titles did not match the questions actually seeded under each id.
--
-- Verified by reading the first question of every unit in seed/002_questions.sql
-- and comparing against the original single-file app. Units 7 through 22 were
-- all mislabeled — unit 12 in particular holds the PA Licensing Law (RELRA)
-- questions but was titled "Leases", which made the PA unit look missing.
--
-- Question data itself is correct and untouched; only the labels change.
-- ─────────────────────────────────────────────────────────────────────────────

update units set title_en = 'Real Estate Taxes and Liens',
                 title_es = 'Impuestos y Gravámenes Inmobiliarios'      where id = 7;
update units set title_en = 'Transfer of Title',
                 title_es = 'Transferencia de Título'                   where id = 8;
update units set title_en = 'Title Records',
                 title_es = 'Registros de Título'                       where id = 9;
update units set title_en = 'Real Estate Contracts',
                 title_es = 'Contratos Inmobiliarios'                   where id = 10;
update units set title_en = 'Real Estate Financing',
                 title_es = 'Financiamiento Inmobiliario'               where id = 11;

-- Unit 12 is the Pennsylvania licensing-law unit (RELRA), not Leases.
update units set title_en = 'PA Licensing Law (RELRA)',
                 title_es = 'Ley de Licencias de PA (RELRA)',
                 is_pa_specific = true                                  where id = 12;

update units set title_en = 'Real Estate Appraisal',
                 title_es = 'Tasación Inmobiliaria'                     where id = 14;
update units set title_en = 'Real Estate Investment',
                 title_es = 'Inversión en Bienes Raíces'                where id = 15;
update units set title_en = 'Real Estate Mathematics',
                 title_es = 'Matemáticas Inmobiliarias'                 where id = 16;
update units set title_en = 'Leases',
                 title_es = 'Arrendamientos'                            where id = 17;
update units set title_en = 'Property Management',
                 title_es = 'Administración de Propiedades'             where id = 18;
update units set title_en = 'Environmental Issues in Real Estate',
                 title_es = 'Asuntos Ambientales en Bienes Raíces'      where id = 19;
update units set title_en = 'Fair Housing',
                 title_es = 'Vivienda Justa'                            where id = 20;
update units set title_en = 'Closing the Real Estate Transaction',
                 title_es = 'Cierre de la Transacción Inmobiliaria'     where id = 21;

-- Unit 22 is the second PA law unit (RELRA review).
update units set title_en = 'Real Estate License Law Review (PA)',
                 title_es = 'Repaso de Ley de Licencias (PA)',
                 is_pa_specific = true                                  where id = 22;
