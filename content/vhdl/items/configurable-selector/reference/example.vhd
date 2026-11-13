library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity configurable_selector is
    generic (
        WIDTH : positive := 8
    );
    port (
        a : in std_logic_vector(WIDTH-1 downto 0);
        b : in std_logic_vector(WIDTH-1 downto 0);
        selection : in std_logic;
        blank : in std_logic;
        data : out std_logic_vector(WIDTH-1 downto 0)
    );
end entity;

architecture rtl of configurable_selector is
begin
    data <= (others=>'0') when blank='1' else b when selection='1' else a;
end architecture;
