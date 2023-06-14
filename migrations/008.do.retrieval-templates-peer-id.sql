ALTER TABLE retrieval_templates
  ADD COLUMN peer_id VARCHAR(64),
  ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- generated using scripts/peer-ids.js
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 1;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 2;
UPDATE retrieval_templates SET peer_id = '12D3KooWHeLUGxJsnsCsHnNW7CpvzumuDVq6vt9NWinUAXtFyD6H' WHERE id = 3;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 4;
UPDATE retrieval_templates SET peer_id = '12D3KooWSsaFCtzDJUEhLQYDdwoFtdCMqqfk562UMvccFz12kYxU' WHERE id = 5;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 6;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 7;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 8;
UPDATE retrieval_templates SET peer_id = '12D3KooWSsaFCtzDJUEhLQYDdwoFtdCMqqfk562UMvccFz12kYxU' WHERE id = 9;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 10;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 11;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 12;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 13;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 14;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 15;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 16;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 17;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 18;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 19;
UPDATE retrieval_templates SET peer_id = '12D3KooWCrBiagtZMzpZePCr1tfBbrZTh4BRQf7JurRqNMRi8YHF' WHERE id = 20;
UPDATE retrieval_templates SET peer_id = '12D3KooWAWcPeDRjFMasZ9D7yfr2Znh3kefPUuyVb66DsM3A72oz' WHERE id = 21;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 22;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 23;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 24;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 25;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 26;
UPDATE retrieval_templates SET peer_id = '12D3KooWCrBiagtZMzpZePCr1tfBbrZTh4BRQf7JurRqNMRi8YHF' WHERE id = 27;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 28;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 29;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 30;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 31;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 32;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 33;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 34;
UPDATE retrieval_templates SET peer_id = '12D3KooWCrBiagtZMzpZePCr1tfBbrZTh4BRQf7JurRqNMRi8YHF' WHERE id = 35;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 36;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 37;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 38;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 39;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 40;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 41;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 42;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 43;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 44;
UPDATE retrieval_templates SET peer_id = '12D3KooWDMJSprsuxhjJVnuQQcyibc5GxanUUxpDzHU74rhknqkU' WHERE id = 45;
UPDATE retrieval_templates SET peer_id = '12D3KooWCrBiagtZMzpZePCr1tfBbrZTh4BRQf7JurRqNMRi8YHF' WHERE id = 46;
UPDATE retrieval_templates SET peer_id = '12D3KooWSekjEqdSeHXkpQraVY2STL885svgmh6r2zEFHQKeJ3KD' WHERE id = 47;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 48;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 49;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 50;
UPDATE retrieval_templates SET peer_id = '12D3KooWQrNXDw6YEbhPKm4WFAxNa7DiH17nKwab133F7JM1Spyr' WHERE id = 51;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 52;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 53;
UPDATE retrieval_templates SET peer_id = '12D3KooWEkQFhSUc17MNC4gimbRYakSSCmDiQwMLhcvToh7bsXbN' WHERE id = 54;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 55;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 56;
UPDATE retrieval_templates SET peer_id = '12D3KooWDMJSprsuxhjJVnuQQcyibc5GxanUUxpDzHU74rhknqkU' WHERE id = 57;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 58;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 59;
UPDATE retrieval_templates SET peer_id = '12D3KooWKyQ5yN39BbCqyG2JVxVA3pGCw6BQkaXRiBVTL7raczg4' WHERE id = 60;
UPDATE retrieval_templates SET peer_id = '12D3KooWEkQFhSUc17MNC4gimbRYakSSCmDiQwMLhcvToh7bsXbN' WHERE id = 61;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 62;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 63;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 64;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 65;
UPDATE retrieval_templates SET peer_id = '12D3KooWKyQ5yN39BbCqyG2JVxVA3pGCw6BQkaXRiBVTL7raczg4' WHERE id = 66;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 67;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 68;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 69;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 70;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 71;
UPDATE retrieval_templates SET peer_id = '12D3KooWEkQFhSUc17MNC4gimbRYakSSCmDiQwMLhcvToh7bsXbN' WHERE id = 72;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 73;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 74;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 75;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 76;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 77;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 78;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 79;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 80;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 81;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 82;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 83;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 84;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 85;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 86;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 87;
UPDATE retrieval_templates SET peer_id = '12D3KooWHKeaNCnYByQUMS2n5PAZ1KZ9xKXqsb4bhpxVJ6bBJg5V' WHERE id = 88;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 89;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 90;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 91;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 92;
UPDATE retrieval_templates SET peer_id = '12D3KooWKyQ5yN39BbCqyG2JVxVA3pGCw6BQkaXRiBVTL7raczg4' WHERE id = 93;
UPDATE retrieval_templates SET peer_id = '12D3KooWAWcPeDRjFMasZ9D7yfr2Znh3kefPUuyVb66DsM3A72oz' WHERE id = 94;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 95;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 96;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 97;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 98;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 99;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 100;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 101;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 102;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 103;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 104;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 105;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 106;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 107;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 108;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 109;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 110;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 111;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 112;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 113;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 114;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 115;
UPDATE retrieval_templates SET peer_id = '12D3KooWAWcPeDRjFMasZ9D7yfr2Znh3kefPUuyVb66DsM3A72oz' WHERE id = 116;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 117;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 118;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 119;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 120;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 121;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 122;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 123;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 124;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 125;
UPDATE retrieval_templates SET peer_id = '12D3KooWBwUERBhJPtZ7hg5N3q1DesvJ67xx9RLdSaStBz9Y6Ny8' WHERE id = 126;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 127;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 128;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 129;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 130;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 131;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 132;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 133;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 134;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 135;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 136;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 137;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 138;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 139;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 140;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 141;
UPDATE retrieval_templates SET peer_id = 'Qma8ddFEQWEU8ijWvdxXm3nxU7oHsRtCykAaVz8WUYhiKn' WHERE id = 142;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 143;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 144;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 145;
UPDATE retrieval_templates SET peer_id = '12D3KooWC6yTujaBnBb7HpzM5LF7Hzp4QBPcYttMJUJHMJ16qYPT' WHERE id = 146;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 147;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 148;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 149;
UPDATE retrieval_templates SET peer_id = '12D3KooWSsaFCtzDJUEhLQYDdwoFtdCMqqfk562UMvccFz12kYxU' WHERE id = 150;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 151;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 152;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 153;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 154;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 155;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 156;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 157;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 158;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 159;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 160;
UPDATE retrieval_templates SET peer_id = '12D3KooWABn18HM5hLcu3vgg2K3pu9ETB6YtoTpjSU4LiUoKRAkP' WHERE id = 161;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 162;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 163;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 164;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 165;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 166;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 167;
UPDATE retrieval_templates SET peer_id = '12D3KooWCrBiagtZMzpZePCr1tfBbrZTh4BRQf7JurRqNMRi8YHF' WHERE id = 168;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 169;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 170;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 171;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 172;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 173;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 174;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 175;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 176;
UPDATE retrieval_templates SET peer_id = '12D3KooWSPtnggJL5wkoAmtgGCosViEC6Z2heTmt7ZTF98GYPyKq' WHERE id = 177;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 178;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 179;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 180;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 181;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 182;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 183;
UPDATE retrieval_templates SET peer_id = '12D3KooWSsaFCtzDJUEhLQYDdwoFtdCMqqfk562UMvccFz12kYxU' WHERE id = 184;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 185;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 186;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 187;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 188;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 189;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 190;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 191;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 192;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 193;
UPDATE retrieval_templates SET peer_id = '12D3KooWSPtnggJL5wkoAmtgGCosViEC6Z2heTmt7ZTF98GYPyKq' WHERE id = 194;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 195;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 196;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 197;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 198;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 199;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 200;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 201;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 202;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 203;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 204;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 205;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 206;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 207;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 208;
UPDATE retrieval_templates SET peer_id = 'not found', enabled = FALSE WHERE id = 209;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 210;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 211;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 212;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 213;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 214;
UPDATE retrieval_templates SET peer_id = 'QmQzqxhK82kAmKvARFZSkUVS6fo9sySaiogAnx5EnZ6ZmC' WHERE id = 215;
-- end generated using scripts/peer-ids.js

ALTER TABLE retrieval_templates ALTER COLUMN peer_id SET NOT NULL;
