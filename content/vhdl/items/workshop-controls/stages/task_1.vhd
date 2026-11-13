library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        button_a : in std_logic;
        button_b : in std_logic;
        blocked : in std_logic;
        available : out std_logic;
        start : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    available <= not blocked;
    start <= '0';
end architecture;
