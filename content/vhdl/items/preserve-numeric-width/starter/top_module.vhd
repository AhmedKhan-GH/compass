library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (
    a : in std_logic_vector(7 downto 0);
    b : in std_logic_vector(7 downto 0);
    full_sum : out std_logic_vector(8 downto 0);
    wrapped : out std_logic_vector(7 downto 0);
    carry : out std_logic
    );
end entity;
architecture rtl of top_module is
    begin
    -- Task 1. Preserve the full sum: implement this requirement.
    -- Task 2. Expose truncation and carry: implement this requirement.
    full_sum <= (others => '0');
    wrapped <= (others => '0');
    carry <= '0';
end architecture;
