library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (
    level : in std_logic_vector(7 downto 0);
    limit : in std_logic_vector(7 downto 0);
    enable : in std_logic;
    raw_high : out std_logic;
    alarm : out std_logic
    );
end entity;
architecture rtl of top_module is
    begin
    -- Task 1. Connect the comparison component: implement this requirement.
    -- Task 2. Apply the cabinet permission: implement this requirement.
    raw_high <= '0';
    alarm <= '0';
end architecture;
