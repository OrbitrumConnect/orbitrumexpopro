-- SEED: 8 profissionais para demo inicial do Orbitrum
-- Rodar no Supabase SQL Editor DEPOIS de chat-tables.sql
-- Profissionais na região do RJ com coordenadas reais

INSERT INTO professionals (name, title, email, phone, cpf, cep, pix_key, avatar, orbit_ring, orbit_position, services, hourly_rate, available, is_demo, latitude, longitude, city, state, skills, experience_years, specializations, work_preferences)
VALUES
  ('Carlos Silva', 'Pintor Residencial', 'carlos.pintor@demo.orbitrum.com', '21999001001', '00000000001', '20040020', 'pendente', '', 1, 0, ARRAY['Pintura residencial', 'Pintura comercial', 'Textura'], 45, true, true, -22.9068, -43.1729, 'Rio de Janeiro', 'RJ', ARRAY['pintura', 'textura', 'acabamento'], 8, ARRAY['Pintura decorativa'], ARRAY['presencial']),

  ('João Pereira', 'Encanador', 'joao.encanador@demo.orbitrum.com', '21999001002', '00000000002', '20521060', 'pendente', '', 1, 1, ARRAY['Reparo de vazamentos', 'Instalação hidráulica', 'Desentupimento'], 55, true, true, -22.9249, -43.2340, 'Rio de Janeiro', 'RJ', ARRAY['hidraulica', 'esgoto', 'agua'], 12, ARRAY['Reparos emergenciais'], ARRAY['presencial']),

  ('Rafael Costa', 'Eletricista', 'rafael.eletricista@demo.orbitrum.com', '21999001003', '00000000003', '22631004', 'pendente', '', 1, 2, ARRAY['Instalação elétrica', 'Reparo de tomadas', 'Quadro elétrico'], 65, true, true, -22.9839, -43.3657, 'Rio de Janeiro', 'RJ', ARRAY['eletrica', 'instalacao', 'manutencao'], 10, ARRAY['Instalações residenciais'], ARRAY['presencial']),

  ('Maria Limpeza', 'Diarista', 'maria.diarista@demo.orbitrum.com', '21999001004', '00000000004', '20031040', 'pendente', '', 2, 0, ARRAY['Faxina geral', 'Organização', 'Limpeza pós-obra'], 30, true, true, -22.9035, -43.1823, 'Rio de Janeiro', 'RJ', ARRAY['limpeza', 'organizacao'], 6, ARRAY['Limpeza residencial'], ARRAY['presencial']),

  ('Amanda Ribeiro', 'Cabeleireira', 'amanda.cabelo@demo.orbitrum.com', '21999001005', '00000000005', '22420030', 'pendente', '', 2, 4, ARRAY['Corte feminino', 'Coloração', 'Escova progressiva'], 40, true, true, -22.9648, -43.2075, 'Rio de Janeiro', 'RJ', ARRAY['corte', 'coloracao', 'tratamento'], 9, ARRAY['Coloração'], ARRAY['presencial']),

  ('Marcos Souza', 'Pedreiro', 'marcos.pedreiro@demo.orbitrum.com', '21999001006', '00000000006', '20720280', 'pendente', '', 2, 5, ARRAY['Reforma geral', 'Alvenaria', 'Reboco e acabamento'], 55, true, true, -22.9345, -43.2776, 'Rio de Janeiro', 'RJ', ARRAY['alvenaria', 'reforma', 'acabamento'], 15, ARRAY['Reformas completas'], ARRAY['presencial']),

  ('Fernanda Santos', 'Babá', 'fernanda.baba@demo.orbitrum.com', '21999001007', '00000000007', '22250040', 'pendente', '', 1, 4, ARRAY['Cuidado infantil', 'Acompanhamento escolar', 'Recreação'], 25, true, true, -22.9519, -43.1827, 'Rio de Janeiro', 'RJ', ARRAY['cuidado infantil', 'educacao'], 5, ARRAY['Primeira infância'], ARRAY['presencial']),

  ('Bruno Martins', 'Técnico em Ar Condicionado', 'bruno.arcond@demo.orbitrum.com', '21999001008', '00000000008', '22450070', 'pendente', '', 3, 4, ARRAY['Instalação split', 'Manutenção preventiva', 'Limpeza'], 70, true, true, -22.9157, -43.2274, 'Rio de Janeiro', 'RJ', ARRAY['ar condicionado', 'refrigeracao'], 7, ARRAY['Split e multi-split'], ARRAY['presencial'])

ON CONFLICT (email) DO NOTHING;
