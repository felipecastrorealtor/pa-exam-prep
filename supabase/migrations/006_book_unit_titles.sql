-- Unit titles taken verbatim from the textbook's table of contents.
--
-- Applied here only to the units whose seeded questions actually match the
-- book's unit. Units 14-22 hold questions belonging to DIFFERENT book units
-- (appraisal sits under 14, fair housing under 20, PA license law under 22,
-- and so on), so renaming those to the book's titles would make the mismatch
-- worse, not better. That renumbering is a separate decision.

update units set title_en = 'Real Property and the Law',
                 title_es = 'Propiedad Real y la Ley'                        where id = 1;
update units set title_en = 'Land-Use Controls and Property Development',
                 title_es = 'Controles de Uso del Suelo y Desarrollo'        where id = 2;
update units set title_en = 'Environmental Issues in Real Estate',
                 title_es = 'Asuntos Ambientales en Bienes Raíces'           where id = 3;
update units set title_en = 'Legal Descriptions',
                 title_es = 'Descripciones Legales'                          where id = 4;
update units set title_en = 'Interests in Real Estate',
                 title_es = 'Intereses en Bienes Raíces'                     where id = 5;
update units set title_en = 'Forms of Real Estate Ownership',
                 title_es = 'Formas de Propiedad Inmobiliaria'               where id = 6;
update units set title_en = 'Real Estate Taxes and Liens',
                 title_es = 'Impuestos y Gravámenes Inmobiliarios'           where id = 7;
update units set title_en = 'Transfer of Title',
                 title_es = 'Transferencia de Título'                        where id = 8;
update units set title_en = 'Title Records',
                 title_es = 'Registros de Título'                            where id = 9;
update units set title_en = 'Real Estate Contracts',
                 title_es = 'Contratos Inmobiliarios'                        where id = 10;
update units set title_en = 'Principles of Real Estate Financing',
                 title_es = 'Principios de Financiamiento Inmobiliario'      where id = 11;

-- The PA licensing unit, by its proper name.
update units set title_en = 'Pennsylvania Real Estate Licensing Law',
                 title_es = 'Ley de Licencias Inmobiliarias de Pensilvania',
                 is_pa_specific = true                                       where id = 12;

-- Unit 13 exists in the book and was wrongly recorded as "not in this edition".
-- It has no questions yet, so it stays disabled until it does.
update units set title_en = 'The Real Estate Business',
                 title_es = 'El Negocio Inmobiliario',
                 enabled  = false                                            where id = 13;

update units set title_en = 'Closing the Real Estate Transaction',
                 title_es = 'Cierre de la Transacción Inmobiliaria'          where id = 21;
