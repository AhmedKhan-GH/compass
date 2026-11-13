library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    generic (
        LANES : positive := 4
    );
    port (
        request : in std_logic_vector(LANES-1 downto 0);
        inhibit : in std_logic_vector(LANES-1 downto 0);
        grant : out std_logic_vector(LANES-1 downto 0);
        any_grant : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    -- Task 1. Generate independent permissions: implement this requirement.
    -- Task 2. Select the summary structure: implement this requirement.
    grant <= (others => '0');
    any_grant <= '0';
end architecture;
