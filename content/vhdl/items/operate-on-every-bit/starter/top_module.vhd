library ieee;
use ieee.std_logic_1164.all;
entity top_module is
    port (
    status : in std_logic_vector(7 downto 0);
    mask : in std_logic_vector(7 downto 0);
    inverted : out std_logic_vector(7 downto 0);
    kept : out std_logic_vector(7 downto 0);
    toggled : out std_logic_vector(7 downto 0)
    );
end entity;
architecture rtl of top_module is
    begin
    -- Task 1. Invert the word: implement this requirement.
    -- Task 2. Select the visible positions: implement this requirement.
    -- Task 3. Toggle the whole display: implement this requirement.
    inverted <= (others => '0');
    kept <= (others => '0');
    toggled <= (others => '0');
end architecture;
