library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (
        clk, reset, request_a, request_b : in std_logic;
        permit_a, permit_b : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    permit_a <= '0';
    permit_b <= '0'; -- TODO: grant one request at a time
end architecture;
