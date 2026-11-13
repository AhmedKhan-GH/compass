library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        channel_a : in std_logic_vector(3 downto 0);
        channel_b : in std_logic_vector(3 downto 0);
        select_b : in std_logic;
        channel : in std_logic_vector(1 downto 0);
        override_active : in std_logic;
        override_data : in std_logic_vector(3 downto 0);
        selected : out std_logic_vector(3 downto 0);
        decoded : out std_logic_vector(3 downto 0);
        priority_selected : out std_logic_vector(3 downto 0)
    );
end entity;

architecture rtl of top_module is
begin
    -- Task 1. Choose A or B with one control bit: implement this requirement.
    -- Task 2. Choose A or B with a two-bit code: implement this requirement.
    -- Task 3. Add a switch that selects override_data: implement this requirement.
    selected <= (others => '0');
    decoded <= (others => '0');
    priority_selected <= (others => '0');
end architecture;
